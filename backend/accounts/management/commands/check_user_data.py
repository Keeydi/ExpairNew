from django.core.management.base import BaseCommand
from accounts.models import User, Conversation

class Command(BaseCommand):
    help = 'Check user data in conversations'

    def handle(self, *args, **options):
        self.stdout.write("=== USER DATA CHECK ===")
        
        # Check all users
        users = User.objects.all()
        self.stdout.write(f"Total users: {users.count()}")
        
        for user in users[:5]:  # Show first 5 users
            self.stdout.write(f"User {user.id}: {user.username} - {user.first_name} {user.last_name}")
            self.stdout.write(f"  Profile pic: {user.profilePic}")
        
        # Check conversations
        conversations = Conversation.objects.all()
        self.stdout.write(f"\nTotal conversations: {conversations.count()}")
        
        for conv in conversations[:3]:  # Show first 3 conversations
            self.stdout.write(f"Conversation {conv.conversation_id}:")
            self.stdout.write(f"  Requester: {conv.requester.username} (ID: {conv.requester_id})")
            
            # Handle orphaned responder gracefully
            try:
                responder_name = conv.responder.username
                responder_full_name = f"{conv.responder.first_name} {conv.responder.last_name}"
                responder_profile_pic = conv.responder.profilePic
            except User.DoesNotExist:
                responder_name = "UNKNOWN USER"
                responder_full_name = "UNKNOWN USER"
                responder_profile_pic = None
                self.stdout.write(f"  WARNING: Responder ID {conv.responder_id} does not exist!")
            
            self.stdout.write(f"  Responder: {responder_name} (ID: {conv.responder_id})")
            self.stdout.write(f"  Requester name: {conv.requester.first_name} {conv.requester.last_name}")
            self.stdout.write(f"  Responder name: {responder_full_name}")
            self.stdout.write(f"  Requester profile pic: {conv.requester.profilePic}")
            self.stdout.write(f"  Responder profile pic: {responder_profile_pic}")
            self.stdout.write("")
