from django.db import migrations

def load_specialized_skills(apps, schema_editor):
    """Load initial specialized skills"""
    SpecSkill = apps.get_model('accounts', 'SpecSkill')
    GenSkill = apps.get_model('accounts', 'GenSkill')
    
    # Data with foreign key references
    skills_data = [
        {'specSkills_id': 1, 'genskills_id': 1, 'specName': 'Graphic Design'},
        {'specSkills_id': 2, 'genskills_id': 1, 'specName': 'Photography'},
        {'specSkills_id': 3, 'genskills_id': 1, 'specName': 'Video Editing'},
        {'specSkills_id': 4, 'genskills_id': 1, 'specName': 'Illustration'},
        {'specSkills_id': 5, 'genskills_id': 1, 'specName': 'Animation'},
        {'specSkills_id': 6, 'genskills_id': 2, 'specName': 'Web Development'},
        {'specSkills_id': 7, 'genskills_id': 2, 'specName': 'Software Development'},
        {'specSkills_id': 8, 'genskills_id': 2, 'specName': 'IT Support'},
        {'specSkills_id': 9, 'genskills_id': 2, 'specName': 'Network Administration'},
        {'specSkills_id': 10, 'genskills_id': 2, 'specName': 'Cybersecurity'},
        {'specSkills_id': 11, 'genskills_id': 3, 'specName': 'Project Management'},
        {'specSkills_id': 12, 'genskills_id': 3, 'specName': 'Business Consulting'},
        {'specSkills_id': 13, 'genskills_id': 3, 'specName': 'Human Resources'},
        {'specSkills_id': 14, 'genskills_id': 3, 'specName': 'Operations Management'},
        {'specSkills_id': 15, 'genskills_id': 3, 'specName': 'Marketing Strategy'},
        {'specSkills_id': 16, 'genskills_id': 4, 'specName': 'Customer Service'},
        {'specSkills_id': 17, 'genskills_id': 4, 'specName': 'Public Relations'},
        {'specSkills_id': 18, 'genskills_id': 4, 'specName': 'Copywriting'},
        {'specSkills_id': 19, 'genskills_id': 4, 'specName': 'Multilingual Communication'},
        {'specSkills_id': 20, 'genskills_id': 4, 'specName': 'Online Community Engagement'},
        {'specSkills_id': 21, 'genskills_id': 5, 'specName': 'Nutrition Coaching'},
        {'specSkills_id': 22, 'genskills_id': 5, 'specName': 'Personal Training'},
        {'specSkills_id': 23, 'genskills_id': 5, 'specName': 'Mental Health Counseling'},
        {'specSkills_id': 24, 'genskills_id': 5, 'specName': 'Yoga Instruction'},
        {'specSkills_id': 25, 'genskills_id': 5, 'specName': 'Fitness Coaching'},
        {'specSkills_id': 26, 'genskills_id': 6, 'specName': 'Tutoring'},
        {'specSkills_id': 27, 'genskills_id': 6, 'specName': 'Language Instruction'},
        {'specSkills_id': 28, 'genskills_id': 6, 'specName': 'Corporate Training'},
        {'specSkills_id': 29, 'genskills_id': 6, 'specName': 'Curriculum Development'},
        {'specSkills_id': 30, 'genskills_id': 6, 'specName': 'Test Preparation'},
        {'specSkills_id': 31, 'genskills_id': 7, 'specName': 'Interior Decorating'},
        {'specSkills_id': 32, 'genskills_id': 7, 'specName': 'Cleaning Services'},
        {'specSkills_id': 33, 'genskills_id': 7, 'specName': 'Gardening'},
        {'specSkills_id': 34, 'genskills_id': 7, 'specName': 'Event Planning'},
        {'specSkills_id': 35, 'genskills_id': 7, 'specName': 'Personal Assistance'},
        {'specSkills_id': 36, 'genskills_id': 8, 'specName': 'Furniture Assembly'},
        {'specSkills_id': 37, 'genskills_id': 8, 'specName': 'Sewing & Alterations'},
        {'specSkills_id': 38, 'genskills_id': 8, 'specName': 'Handyman Services'},
        {'specSkills_id': 39, 'genskills_id': 8, 'specName': 'Painting & Decorating'},
        {'specSkills_id': 40, 'genskills_id': 8, 'specName': 'Crafting'},
        {'specSkills_id': 41, 'genskills_id': 9, 'specName': 'Social Media Management'},
        {'specSkills_id': 42, 'genskills_id': 9, 'specName': 'Content Creation'},
        {'specSkills_id': 43, 'genskills_id': 9, 'specName': 'SEO'},
        {'specSkills_id': 44, 'genskills_id': 9, 'specName': 'Digital Advertising'},
        {'specSkills_id': 45, 'genskills_id': 9, 'specName': 'Email Marketing'},
        {'specSkills_id': 46, 'genskills_id': 10, 'specName': 'Translation'},
        {'specSkills_id': 47, 'genskills_id': 10, 'specName': 'Interpretation'},
        {'specSkills_id': 48, 'genskills_id': 10, 'specName': 'Language Tutoring'},
        {'specSkills_id': 49, 'genskills_id': 10, 'specName': 'Transcription'},
        {'specSkills_id': 50, 'genskills_id': 10, 'specName': 'Localization'},
        {'specSkills_id': 51, 'genskills_id': 11, 'specName': 'Bookkeeping'},
        {'specSkills_id': 52, 'genskills_id': 11, 'specName': 'Tax Preparation'},
        {'specSkills_id': 53, 'genskills_id': 11, 'specName': 'Financial Planning'},
        {'specSkills_id': 54, 'genskills_id': 11, 'specName': 'Payroll Services'},
        {'specSkills_id': 55, 'genskills_id': 11, 'specName': 'Auditing'},
        {'specSkills_id': 56, 'genskills_id': 12, 'specName': 'Personal Training'},
        {'specSkills_id': 57, 'genskills_id': 12, 'specName': 'Group Fitness Instruction'},
        {'specSkills_id': 58, 'genskills_id': 12, 'specName': 'Sports Coaching'},
        {'specSkills_id': 59, 'genskills_id': 12, 'specName': 'Nutrition for Athletes'},
        {'specSkills_id': 60, 'genskills_id': 12, 'specName': 'Physical Therapy'},
        {'specSkills_id': 61, 'genskills_id': 13, 'specName': 'Music Lessons'},
        {'specSkills_id': 62, 'genskills_id': 13, 'specName': 'Dance Instruction'},
        {'specSkills_id': 63, 'genskills_id': 13, 'specName': 'Acting Coaching'},
        {'specSkills_id': 64, 'genskills_id': 13, 'specName': 'Visual Arts'},
        {'specSkills_id': 65, 'genskills_id': 13, 'specName': 'Creative Writing'},
        {'specSkills_id': 66, 'genskills_id': 14, 'specName': 'Diversity Training'},
        {'specSkills_id': 67, 'genskills_id': 14, 'specName': 'Cultural Consulting'},
        {'specSkills_id': 68, 'genskills_id': 14, 'specName': 'Language & Cultural Exchange'},
        {'specSkills_id': 69, 'genskills_id': 14, 'specName': 'Community Outreach'},
        {'specSkills_id': 70, 'genskills_id': 14, 'specName': 'Inclusion Workshops'},
        {'specSkills_id': 71, 'genskills_id': 15, 'specName': 'Market Research'},
        {'specSkills_id': 72, 'genskills_id': 15, 'specName': 'Data Analysis'},
        {'specSkills_id': 73, 'genskills_id': 15, 'specName': 'Academic Research'},
        {'specSkills_id': 74, 'genskills_id': 15, 'specName': 'Competitive Analysis'},
        {'specSkills_id': 75, 'genskills_id': 15, 'specName': 'Strategic Planning'},
    ]
    
    # Create each specialized skill with proper foreign key reference
    for skill_data in skills_data:
        genskill_id = skill_data.pop('genskills_id')
        genskill = GenSkill.objects.get(genSkills_id=genskill_id)
        # Use get_or_create to avoid duplicates
        SpecSkill.objects.get_or_create(genSkills_id=genskill, **skill_data)

def remove_specialized_skills(apps, schema_editor):
    """Reverse migration - remove all specialized skills"""
    SpecSkill = apps.get_model('accounts', 'SpecSkill')
    SpecSkill.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_load_general_skills'),  # Depends on previous migration
    ]

    operations = [
        migrations.RunPython(load_specialized_skills, remove_specialized_skills),
    ]