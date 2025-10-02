from django.db import migrations

def load_general_skills(apps, schema_editor):
    """Load initial general skills categories"""
    # Get the model (use historical version)
    GenSkill = apps.get_model('accounts', 'GenSkill')
    
    skills_data = [
        {'genSkills_id': 1, 'genCateg': 'Creative & Design'},
        {'genSkills_id': 2, 'genCateg': 'Technical & IT'},
        {'genSkills_id': 3, 'genCateg': 'Business & Management'},
        {'genSkills_id': 4, 'genCateg': 'Communication & Interpersonal'},
        {'genSkills_id': 5, 'genCateg': 'Health & Wellness'},
        {'genSkills_id': 6, 'genCateg': 'Education & Training'},
        {'genSkills_id': 7, 'genCateg': 'Home & Lifestyle'},
        {'genSkills_id': 8, 'genCateg': 'Handiwork & Maintenance'},
        {'genSkills_id': 9, 'genCateg': 'Digital & Social Media'},
        {'genSkills_id': 10, 'genCateg': 'Language & Translation'},
        {'genSkills_id': 11, 'genCateg': 'Financial & Accounting'},
        {'genSkills_id': 12, 'genCateg': 'Sports & Fitness'},
        {'genSkills_id': 13, 'genCateg': 'Arts & Performance'},
        {'genSkills_id': 14, 'genCateg': 'Culture & Diversity'},
        {'genSkills_id': 15, 'genCateg': 'Research & Critical Thinking'},
    ]
    
    for skill_data in skills_data:
        # Use get_or_create to avoid duplicates
        GenSkill.objects.get_or_create(**skill_data)

def remove_general_skills(apps, schema_editor):
    """Reverse migration - remove all general skills"""
    GenSkill = apps.get_model('accounts', 'GenSkill')
    GenSkill.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),  # Update this to your last migration number
    ]

    operations = [
        migrations.RunPython(load_general_skills, remove_general_skills),
    ]