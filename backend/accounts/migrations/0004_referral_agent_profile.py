from django.db import migrations, models

# The old role value, spelled out here because the model no longer defines it.
LEGACY_AGENT_ROLE = "referral_agent"


def agents_to_tourist_profiles(apps, schema_editor):
    """Every existing agent keeps their login; they become a tourist account with the
    agent profile switched on, so the same email can now also book trips."""
    User = apps.get_model("accounts", "User")
    User.objects.filter(role=LEGACY_AGENT_ROLE).update(role="tourist", is_referral_agent=True)


def tourist_profiles_to_agents(apps, schema_editor):
    """Reverse: agent profiles become agent-role accounts again. A tourist who had both
    trips and an agent profile loses tourist access on the way back — the old model
    simply had no way to express both."""
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_referral_agent=True).update(role=LEGACY_AGENT_ROLE)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_referral_agent',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(agents_to_tourist_profiles, tourist_profiles_to_agents),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('tourist', 'Tourist'), ('guide', 'Guide'), ('admin', 'Administrator')], default='tourist', max_length=20),
        ),
    ]
