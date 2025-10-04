from django.core.management.base import BaseCommand
from django.db import transaction, connection
from accounts.models import User, Conversation, Message, TradeRequest, TradeInterest, UserInterest, UserSkill, UserCredential, PasswordResetToken

class Command(BaseCommand):
    help = 'Reset database to have only 2 users with IDs 1 and 2, and clean up all orphaned data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm reset without prompt',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                "WARNING: This will DELETE ALL data except 2 users and reset their IDs to 1 and 2."
            ))
            confirm = input("Are you sure you want to proceed? (yes/no): ")
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.NOTICE("Operation cancelled."))
                return

        self.stdout.write("=== RESETTING DATABASE TO 2 USERS ===")

        with transaction.atomic():
            # Count current users
            user_count = User.objects.count()
            self.stdout.write(f"Current users: {user_count}")
            
            if user_count != 2:
                self.stdout.write(self.style.ERROR(
                    f"Expected exactly 2 users, found {user_count}. Please ensure you have exactly 2 users first."
                ))
                return

            # Get the 2 users
            users = list(User.objects.all().order_by('id'))
            user1 = users[0]  # Will become ID 1
            user2 = users[1]  # Will become ID 2
            
            self.stdout.write(f"User 1: {user1.username} (current ID: {user1.id})")
            self.stdout.write(f"User 2: {user2.username} (current ID: {user2.id})")

            # Count records before deletion
            conversation_count = Conversation.objects.count()
            message_count = Message.objects.count()
            trade_request_count = TradeRequest.objects.count()
            trade_interest_count = TradeInterest.objects.count()
            user_interest_count = UserInterest.objects.count()
            user_skill_count = UserSkill.objects.count()
            user_credential_count = UserCredential.objects.count()
            password_reset_count = PasswordResetToken.objects.count()

            self.stdout.write(f"\nRecords to be deleted:")
            self.stdout.write(f"  Conversations: {conversation_count}")
            self.stdout.write(f"  Messages: {message_count}")
            self.stdout.write(f"  Trade Requests: {trade_request_count}")
            self.stdout.write(f"  Trade Interests: {trade_interest_count}")
            self.stdout.write(f"  User Interests: {user_interest_count}")
            self.stdout.write(f"  User Skills: {user_skill_count}")
            self.stdout.write(f"  User Credentials: {user_credential_count}")
            self.stdout.write(f"  Password Reset Tokens: {password_reset_count}")

            self.stdout.write("\nDeleting all data except users...")

            with connection.cursor() as cursor:
                # Delete all data in reverse dependency order
                cursor.execute("DELETE FROM messages_tbl")
                self.stdout.write("  [OK] Messages deleted")

                cursor.execute("DELETE FROM conversations_tbl")
                self.stdout.write("  [OK] Conversations deleted")

                cursor.execute("DELETE FROM trade_interests_tbl")
                self.stdout.write("  [OK] Trade Interests deleted")

                cursor.execute("DELETE FROM tradehis_tbl")
                self.stdout.write("  [OK] Trade History deleted")

                cursor.execute("DELETE FROM tradereq_tbl")
                self.stdout.write("  [OK] Trade Requests deleted")

                cursor.execute("DELETE FROM userinterests_tbl")
                self.stdout.write("  [OK] User Interests deleted")

                cursor.execute("DELETE FROM userskills_tbl")
                self.stdout.write("  [OK] User Skills deleted")

                cursor.execute("DELETE FROM usercredentials_tbl")
                self.stdout.write("  [OK] User Credentials deleted")

                cursor.execute("DELETE FROM password_reset_token_tbl")
                self.stdout.write("  [OK] Password Reset Tokens deleted")

                cursor.execute("DELETE FROM token_blacklist_outstandingtoken")
                self.stdout.write("  [OK] JWT Outstanding Tokens deleted")

                cursor.execute("DELETE FROM token_blacklist_blacklistedtoken")
                self.stdout.write("  [OK] JWT Blacklisted Tokens deleted")

            # Now reset user IDs to 1 and 2
            self.stdout.write("\nResetting user IDs to 1 and 2...")
            
            with connection.cursor() as cursor:
                # Temporarily disable foreign key checks
                cursor.execute("SET session_replication_role = replica;")
                
                # Update user IDs
                cursor.execute("UPDATE users_tbl SET user_id = 1 WHERE user_id = %s", [user1.id])
                cursor.execute("UPDATE users_tbl SET user_id = 2 WHERE user_id = %s", [user2.id])
                
                # Reset the sequence to start from 3 (next available ID)
                cursor.execute("SELECT setval('users_tbl_user_id_seq', 2, true);")
                
                # Re-enable foreign key checks
                cursor.execute("SET session_replication_role = DEFAULT;")
                
                self.stdout.write("  [OK] User IDs reset to 1 and 2")
                self.stdout.write("  [OK] Sequence reset to start from 3")

        # Verify the result
        self.stdout.write("\n=== VERIFICATION ===")
        users_after = User.objects.all().order_by('id')
        for user in users_after:
            self.stdout.write(f"User {user.id}: {user.username} - {user.first_name} {user.last_name}")

        self.stdout.write(
            self.style.SUCCESS(
                "\n[SUCCESS] Database reset successfully!\n"
                "Now you have exactly 2 users with IDs 1 and 2.\n"
                "All other data has been cleaned up."
            )
        )
