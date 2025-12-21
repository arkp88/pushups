"""
Google Drive Integration Routes

Handles listing and importing TSV files from Google Drive.
"""
import io
import logging
from flask import Blueprint, request, jsonify
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from config import GOOGLE_DRIVE_API_KEY
from auth import token_required
from services.database import get_db, return_db
from services.tsv_parser import parse_and_save_set

logger = logging.getLogger(__name__)

drive_bp = Blueprint('drive', __name__, url_prefix='/api/drive')


def get_drive_service():
    """
    Create and return Google Drive API service.

    Returns:
        Google Drive API service object

    Raises:
        Exception: If GOOGLE_DRIVE_API_KEY is not configured
    """
    if not GOOGLE_DRIVE_API_KEY:
        raise Exception("GOOGLE_DRIVE_API_KEY not set")
    return build('drive', 'v3', developerKey=GOOGLE_DRIVE_API_KEY)


@drive_bp.route('/files', methods=['GET'])
@token_required
def list_drive_files():
    """
    List files in a Google Drive folder (non-recursive).

    Query Parameters:
        folderId (str): Google Drive folder ID

    Returns:
        JSON response with list of files and folders
    """
    try:
        service = get_drive_service()
        root_folder_id = request.args.get('folderId')
        if not root_folder_id:
            return jsonify({'error': 'Folder ID required'}), 400

        # Query for folders and TSV files only (exclude PDFs and other file types)
        query = f"'{root_folder_id}' in parents and (mimeType = 'application/vnd.google-apps.folder' or (name contains '.tsv' and not name contains '.pdf')) and trashed = false"

        all_files = []
        page_token = None

        while True:
            results = service.files().list(
                q=query,
                pageSize=1000,  # Increased page size
                orderBy="folder,name",
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token
            ).execute()

            items = results.get('files', [])
            # Filter to only include folders and files ending with .tsv
            filtered_items = [
                item for item in items
                if item['mimeType'] == 'application/vnd.google-apps.folder' or item['name'].endswith('.tsv')
            ]
            all_files.extend(filtered_items)

            page_token = results.get('nextPageToken')
            if not page_token:
                break

        return jsonify({'files': all_files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@drive_bp.route('/files/recursive', methods=['GET'])
@token_required
def list_drive_files_recursive():
    """
    Recursively list all TSV files in folder and all subfolders.

    Query Parameters:
        folderId (str): Google Drive folder ID

    Returns:
        JSON response with list of TSV files with full paths
    """
    try:
        service = get_drive_service()
        root_folder_id = request.args.get('folderId')
        if not root_folder_id:
            return jsonify({'error': 'Folder ID required'}), 400

        # Track API calls to prevent hanging on massive folder structures
        api_call_count = {'count': 0}
        MAX_API_CALLS = 100  # Limit to prevent infinite recursion/timeout

        # Recursive function to get all TSV files
        def get_tsv_files_recursive(folder_id, path=""):
            all_tsv_files = []

            # Check if we've hit the API call limit
            api_call_count['count'] += 1
            if api_call_count['count'] > MAX_API_CALLS:
                raise Exception(f'Folder structure too large (scanned {MAX_API_CALLS} folders). Please select a smaller folder.')

            # Get all items in current folder
            query = f"'{folder_id}' in parents and trashed = false"
            results = service.files().list(
                q=query,
                fields="files(id, name, mimeType)",
                pageSize=1000
            ).execute()

            items = results.get('files', [])

            for item in items:
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    # Recursively get files from subfolder
                    subfolder_path = f"{path}/{item['name']}" if path else item['name']
                    all_tsv_files.extend(
                        get_tsv_files_recursive(item['id'], subfolder_path)
                    )
                elif item['name'].endswith('.tsv'):
                    # Add TSV file with full path
                    all_tsv_files.append({
                        'id': item['id'],
                        'name': item['name'],
                        'mimeType': item['mimeType'],
                        'path': path,
                        'fullPath': f"{path}/{item['name']}" if path else item['name']
                    })

            return all_tsv_files

        files = get_tsv_files_recursive(root_folder_id)

        # Hard limit to prevent abuse and ensure reliability
        # 50 files = ~100 seconds processing time (2s per file avg)
        # This stays well under rate limits and timeout constraints
        MAX_FILES = 50
        if len(files) > MAX_FILES:
            return jsonify({
                'error': f'Found {len(files)} files, but recursive import is limited to {MAX_FILES} files per batch to ensure reliable imports.',
                'count': len(files),
                'limit': MAX_FILES
            }), 400

        return jsonify({
            'files': files,
            'count': len(files)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@drive_bp.route('/import', methods=['POST'])
@token_required
def import_drive_file():
    """
    Import a TSV file from Google Drive into the question database.

    Request JSON:
        fileId (str): Google Drive file ID
        setName (str): Name for the question set
        tags (str, optional): Comma-separated tags

    Returns:
        JSON response with import results
    """
    data = request.json
    file_id = data.get('fileId')
    set_name = data.get('setName')
    tags = data.get('tags', '')

    conn = get_db()
    cur = conn.cursor()

    # 1. Check if already imported
    cur.execute('SELECT id FROM question_sets WHERE google_drive_id = %s AND is_deleted = false', (file_id,))
    existing = cur.fetchone()
    if existing:
        return jsonify({'success': True, 'set_id': existing['id'], 'message': 'Already imported'})

    try:
        service = get_drive_service()
        # For public files, simple get_media usually works with API Key
        request_drive = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request_drive)
        done = False
        while done is False:
            status, done = downloader.next_chunk()

        content = fh.getvalue().decode('utf-8')

        set_id, count, expected, is_partial, processing_time = parse_and_save_set(
            content=content,
            set_name=set_name,
            description="Imported from Google Drive",
            user_id=request.current_user['id'],
            tags=tags,
            google_id=file_id
        )

        response = {
            'success': True,
            'set_id': set_id,
            'questions_imported': count,
            'expected_questions': expected,
            'is_partial': is_partial,
            'processing_time': round(processing_time, 2)
        }

        if is_partial:
            # Provide better warning messages based on whether it was a timeout or data issue
            if processing_time > 20:
                response['warning'] = f'Upload took {round(processing_time)}s. Only {count} of {expected} questions were imported. File may be too large for free tier (30s timeout). Consider splitting into smaller files.'
            else:
                response['warning'] = f'Only {count} of {expected} questions were imported. Some rows may be missing required fields (questionText AND answerText).'

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
