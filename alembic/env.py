# alembic/env.py
import os
import sys
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

from alembic import context

# Load .env file from the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Add app directory to path to find models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import Base  # This will now import all models via __init__.py

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # this callback is used to prevent an auto-migration from being generated
    # when there are no changes to the schema
    # def process_revision_directives(context, revision, directives):
    #     if config.cmd_opts.autogenerate and all(
    #         cmd.upgrade_ops.is_empty() for cmd in directives
    #     ):
    #         directives[:] = []
    #         print('No changes in schema detected.')

    configuration = config.get_section(config.config_ini_section)
    # set the sqlalchemy.url from the environment variable
    configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL")
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # process_revision_directives=process_revision_directives
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
