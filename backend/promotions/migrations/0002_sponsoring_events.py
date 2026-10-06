from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("promotions", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(model_name="promotion", old_name="name", new_name="title"),
        migrations.RenameField(model_name="promotion", old_name="desktop_image", new_name="image"),
        migrations.RemoveField(model_name="promotion", name="mobile_image"),
        migrations.RemoveField(model_name="promotion", name="alt_text"),
        migrations.RemoveField(model_name="promotion", name="link_url"),
        migrations.RemoveField(model_name="promotion", name="starts_at"),
        migrations.RemoveField(model_name="promotion", name="ends_at"),
        migrations.RemoveField(model_name="promotion", name="translations"),
        migrations.RemoveField(model_name="promotion", name="click_count"),
        migrations.AddField(
            model_name="promotion",
            name="description",
            field=models.CharField(default="", max_length=500),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="promotion",
            name="phone",
            field=models.CharField(default="", max_length=30),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="promotion",
            options={"ordering": ["order", "id"]},
        ),
    ]
