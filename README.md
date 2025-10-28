# FarmRa
### Made by ScrumOfTheEarth team
FarmRa has the goal of letting farmers easily keep track of the conditions of their fields by easily being able to see sensor data in a clear way. 

Angular frontend and Springboot backend

# Setting up backend
After pulling the project, make sure you have a local postgres database running.
I use DBeaver to connect to mine to make sure its working.

### Env Variables

Then you'll want to set up your own environment file. Make a new file called ".env" in the same
directory as the .env.example, and give all of the environment variables values for how you
set up your database.

### Migrations

Then make sure you run all of the pending migrations. I use sqlx to do this, and there is a markdown
file in the docs folder to show you how to do that. 

If you need to modify the database, make a new migration. You can do this by running this command in the backend directory
`sqlx migrate add new-migration-name -r`

When making the migration, make sure it is completely reversible. Test this out by running the migration with
`sqlx migrate run`
and then run
`sqlx migrate reverse`
and make sure everything is the same as it was before you ran the migration.