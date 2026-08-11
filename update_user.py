from dlx_rest.app import app
from dlx_rest.models import User, SearchHistoryEntry
import logging

logger = logging.getLogger(__name__)

def update_user():
    try:
        # Get the user
        user = User.objects.get(email='eric.attere@un.org')
        logger.info('Found user: %s', user.email)
        
        # Initialize search_history if it doesn't exist
        if not hasattr(user, 'search_history'):
            user.search_history = []
            user.save()
            logger.info('Initialized search_history field')
        
        logger.info('Current search_history: %s', user.search_history)
        
    except Exception as e:
        logger.exception('Error: %s', str(e))

if __name__ == '__main__':
    update_user()