from django.core.management.base import BaseCommand
from django.db import transaction, connection
from accounts.models import User, Conversation, Message

class Command(BaseCommand):
    help = 'Clear only messages and conversations from the database (keep users)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all messages and conversations',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    'This will delete ALL messages and conversations from the database!\n'
                    'Users will be preserved. Use --confirm flag to proceed.'
                )
            )
            return

        self.stdout.write("=== CLEARING MESSAGES AND CONVERSATIONS ===")
        
        with transaction.atomic():
            # Count records before deletion
            conversation_count = Conversation.objects.count()
            message_count = Message.objects.count()
            user_count = User.objects.count()
            
            self.stdout.write(f"Records before deletion:")
            self.stdout.write(f"  Users: {user_count} (will be preserved)")
            self.stdout.write(f"  Conversations: {conversation_count}")
            self.stdout.write(f"  Messages: {message_count}")
            
            # Delete in reverse dependency order using raw SQL
            self.stdout.write("\nDeleting records...")
            
            with connection.cursor() as cursor:
                # Delete messages first (they reference conversations)
                cursor.execute("DELETE FROM messages_tbl")
                self.stdout.write("  [OK] Messages deleted")
                
                # Delete conversations (they reference users and trade requests)
                cursor.execute("DELETE FROM conversations_tbl")
                self.stdout.write("  [OK] Conversations deleted")
            
            # Count records after deletion
            final_conversation_count = Conversation.objects.count()
            final_message_count = Message.objects.count()
            final_user_count = User.objects.count()
            
            self.stdout.write(f"\nRecords after deletion:")
            self.stdout.write(f"  Users: {final_user_count} (preserved)")
            self.stdout.write(f"  Conversations: {final_conversation_count}")
            self.stdout.write(f"  Messages: {final_message_count}")
            
        self.stdout.write(
            self.style.SUCCESS(
                "\n[SUCCESS] Messages and conversations cleared successfully!\n"
                "Users have been preserved."
            )
        )
