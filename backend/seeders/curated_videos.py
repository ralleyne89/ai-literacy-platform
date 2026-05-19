import json
from functools import lru_cache
from pathlib import Path


CATALOG_PATH = Path(__file__).resolve().parents[2] / 'docs' / 'course-content' / 'curated-video-catalog.json'


@lru_cache(maxsize=1)
def get_curated_video_catalog():
    with CATALOG_PATH.open(encoding='utf-8') as catalog_file:
        return json.load(catalog_file)


def get_curated_video(module_id):
    videos = get_curated_video_catalog().get('videos', {})
    video = videos.get(module_id, {})
    return dict(video) if isinstance(video, dict) else {}


def get_curated_video_url(module_id):
    return get_curated_video(module_id).get('video_url', '')
