import json
from urllib.parse import parse_qs, quote, urlparse


EXTERNAL_CONTENT_TYPES = {'external', 'partner', 'affiliate'}


def parse_json_array(value):
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if not isinstance(value, str):
        return []

    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []

    return parsed if isinstance(parsed, list) else []


def normalize_content_type(value):
    return str(value or '').strip().lower()


def normalize_video_embed_url(value):
    raw_url = str(value or '').strip()
    if not raw_url:
        return ''

    parsed = urlparse(raw_url)
    host = parsed.netloc.lower().replace('www.', '')

    if host == 'youtu.be':
        video_id = parsed.path.strip('/').split('/')[0]
        return f'https://www.youtube-nocookie.com/embed/{video_id}' if video_id else raw_url

    if host in {'youtube.com', 'youtube-nocookie.com'}:
        if parsed.path.startswith('/embed/'):
            video_id = parsed.path.split('/embed/', 1)[1].split('/')[0]
            return f'https://www.youtube-nocookie.com/embed/{video_id}' if video_id else raw_url

        video_id = parse_qs(parsed.query).get('v', [''])[0]
        if video_id:
            return f'https://www.youtube-nocookie.com/embed/{video_id}'

    return raw_url


def safe_external_url(value):
    raw_url = str(value or '').strip()
    if not raw_url:
        return None

    parsed = urlparse(raw_url)
    if parsed.scheme in {'http', 'https'} and parsed.netloc:
        return raw_url

    return None


def get_module_lesson_count(module):
    try:
        return len(module.lessons or [])
    except Exception:
        return 0


def module_has_internal_lessons(module):
    return get_module_lesson_count(module) > 0


def build_module_detail_path(module):
    safe_module_id = quote(str(module.id or '').strip(), safe='')
    return f'/training/modules/{safe_module_id}'


def build_module_routing_metadata(module):
    lesson_count = get_module_lesson_count(module)
    has_internal_lessons = lesson_count > 0
    content_type = normalize_content_type(module.content_type)
    detail_path = build_module_detail_path(module)
    learn_path = f'{detail_path}/learn' if has_internal_lessons else None

    metadata = {}
    try:
        prerequisite_payload = json.loads(module.prerequisites) if module.prerequisites else {}
    except (TypeError, ValueError):
        prerequisite_payload = {}

    if isinstance(prerequisite_payload, dict) and isinstance(prerequisite_payload.get('metadata'), dict):
        metadata = prerequisite_payload['metadata']

    external_url = safe_external_url(metadata.get('external_url')) or safe_external_url(module.content_url)

    if has_internal_lessons:
        route_type = 'internal_lessons'
        primary_path = learn_path
    elif content_type in EXTERNAL_CONTENT_TYPES and external_url:
        route_type = 'external_detail'
        primary_path = detail_path
    else:
        route_type = 'module_detail'
        primary_path = detail_path

    return {
        'route_type': route_type,
        'primary_path': primary_path,
        'detail_path': detail_path,
        'learn_path': learn_path,
        'external_url': external_url,
        'is_external': content_type in EXTERNAL_CONTENT_TYPES,
        'has_internal_lessons': has_internal_lessons,
    }


def build_module_start_path(module):
    return build_module_routing_metadata(module)['primary_path']


def build_module_metadata(module):
    lesson_count = get_module_lesson_count(module)
    has_internal_lessons = module_has_internal_lessons(module)
    routing = build_module_routing_metadata(module)

    return {
        'target_domains': parse_json_array(module.target_domains),
        'lesson_count': lesson_count,
        'has_internal_lessons': has_internal_lessons,
        'routing': routing,
        'start_path': routing['primary_path'],
        'route_path': routing['primary_path'],
        'detail_path': routing['detail_path'],
        'learn_path': routing['learn_path'],
        'external_url': routing['external_url'],
    }
