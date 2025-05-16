import os
from alembic import command
from alembic.config import Config
from app.models import Base

def init_migrations():
    # Create migrations directory if it doesn't exist
    if not os.path.exists('migrations'):
        os.makedirs('migrations')
    
    # Create versions directory if it doesn't exist
    if not os.path.exists('migrations/versions'):
        os.makedirs('migrations/versions')
    
    # Create alembic.ini if it doesn't exist
    if not os.path.exists('alembic.ini'):
        config = Config()
        config.set_main_option('script_location', 'migrations')
        config.set_main_option('sqlalchemy.url', 'postgresql://postgres:postgres@localhost/agenda_db')
        config.set_main_option('file_template', '%%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d%%(second).2d_%%(rev)s_%%(slug)s')
        config.set_main_option('timezone', 'UTC')
        config.set_main_option('truncate_slug_length', '40')
        config.set_main_option('revision_environment', 'false')
        config.set_main_option('sourceless', 'false')
        config.set_main_option('version_locations', '%(here)s/migrations/versions')
        config.set_main_option('output_encoding', 'utf-8')
        
        with open('alembic.ini', 'w') as f:
            config.write(f)
    
    # Create initial migration
    config = Config('alembic.ini')
    config.set_main_option('script_location', 'migrations')
    
    # Create initial migration
    command.revision(config, 
                    message='initial',
                    autogenerate=True,
                    version_path='migrations/versions')

if __name__ == '__main__':
    init_migrations() 