import os
from alembic import command
from alembic.config import Config
from app.models import Base
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_migrations():
    # Get database URL from environment variable
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not found in environment variables")
        return

    # Create migrations directory if it doesn't exist
    if not os.path.exists('migrations'):
        os.makedirs('migrations')
    
    # Create versions directory if it doesn't exist
    if not os.path.exists('migrations/versions'):
        os.makedirs('migrations/versions')
    
    # Create alembic.ini if it doesn't exist
    if not os.path.exists('alembic.ini'):
        with open('alembic.ini', 'w') as f:
            f.write("""[alembic]
script_location = migrations
sqlalchemy.url = %(DATABASE_URL)s
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d%%(second).2d_%%(rev)s_%%(slug)s
truncate_slug_length = 40
revision_environment = false
sourceless = false
version_locations = %(here)s/migrations/versions
output_encoding = utf-8

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
""")
    
    # Create initial migration
    config = Config('alembic.ini')
    config.set_main_option('script_location', 'migrations')
    config.set_main_option('sqlalchemy.url', DATABASE_URL)
    
    # Create initial migration
    command.revision(config, 
                    message='initial',
                    autogenerate=True,
                    version_path='migrations/versions')

if __name__ == '__main__':
    init_migrations() 