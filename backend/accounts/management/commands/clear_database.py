from django.core.management.base import BaseCommand
from django.db import transaction, connection
from accounts.models import User, Conversation, Message, TradeRequest, TradeInterest, UserInterest, UserSkill, UserCredential, PasswordResetToken

class Command(BaseCommand):
    help = 'Clear all users, messages, and trades from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    'This will delete ALL users, messages, and trades from the database!\n'
                    'Use --confirm flag to proceed.'
                )
            )
            return

        self.stdout.write("=== CLEARING DATABASE ===")
        
        with transaction.atomic():
            # Count records before deletion
            user_count = User.objects.count()
            conversation_count = Conversation.objects.count()
            message_count = Message.objects.count()
            trade_request_count = TradeRequest.objects.count()
            trade_interest_count = TradeInterest.objects.count()
            user_interest_count = UserInterest.objects.count()
            user_skill_count = UserSkill.objects.count()
            user_credential_count = UserCredential.objects.count()
            password_reset_count = PasswordResetToken.objects.count()
            
            self.stdout.write(f"Records to be deleted:")
            self.stdout.write(f"  Users: {user_count}")
            self.stdout.write(f"  Conversations: {conversation_count}")
            self.stdout.write(f"  Messages: {message_count}")
            self.stdout.write(f"  Trade Requests: {trade_request_count}")
            self.stdout.write(f"  Trade Interests: {trade_interest_count}")
            self.stdout.write(f"  User Interests: {user_interest_count}")
            self.stdout.write(f"  User Skills: {user_skill_count}")
            self.stdout.write(f"  User Credentials: {user_credential_count}")
            self.stdout.write(f"  Password Reset Tokens: {password_reset_count}")
            
            # Delete in reverse dependency order using raw SQL to avoid Django admin issues
            self.stdout.write("\nDeleting records...")
            
            with connection.cursor() as cursor:
                # Delete messages first (they reference conversations)
                cursor.execute("DELETE FROM messages_tbl")
                self.stdout.write("  [OK] Messages deleted")
                
                # Delete conversations (they reference users and trade requests)
                cursor.execute("DELETE FROM conversations_tbl")
                self.stdout.write("  [OK] Conversations deleted")
                
                # Delete trade interests (they reference users and trade requests)
                cursor.execute("DELETE FROM trade_interests_tbl")
                self.stdout.write("  [OK] Trade Interests deleted")
                
                # Delete trade history (they reference trade requests)
                cursor.execute("DELETE FROM tradehis_tbl")
                self.stdout.write("  [OK] Trade History deleted")
                
                # Delete trade requests (they reference users)
                cursor.execute("DELETE FROM tradereq_tbl")
                self.stdout.write("  [OK] Trade Requests deleted")
                
                # Delete user-related data
                cursor.execute("DELETE FROM userinterests_tbl")
                self.stdout.write("  [OK] User Interests deleted")
                
                cursor.execute("DELETE FROM userskills_tbl")
                self.stdout.write("  [OK] User Skills deleted")
                
                cursor.execute("DELETE FROM usercredentials_tbl")
                self.stdout.write("  [OK] User Credentials deleted")
                
                cursor.execute("DELETE FROM password_reset_token_tbl")
                self.stdout.write("  [OK] Password Reset Tokens deleted")
                
                # Delete JWT token blacklist tables
                cursor.execute("DELETE FROM token_blacklist_outstandingtoken")
                self.stdout.write("  [OK] JWT Outstanding Tokens deleted")
                
                cursor.execute("DELETE FROM token_blacklist_blacklistedtoken")
                self.stdout.write("  [OK] JWT Blacklisted Tokens deleted")
                
                # Finally delete users
                cursor.execute("DELETE FROM users_tbl")
                self.stdout.write("  [OK] Users deleted")
            
        self.stdout.write(
            self.style.SUCCESS(
                "\n[SUCCESS] Database cleared successfully!\n"
                "All users, messages, and trades have been removed."
            )
        )
