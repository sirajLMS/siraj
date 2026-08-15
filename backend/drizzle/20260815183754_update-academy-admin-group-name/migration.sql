UPDATE permission_groups
SET name = '{"ar": "مدير الأكاديمية", "en": "Manager"}'::jsonb,
    description = '{"ar": "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات", "en": "Full system access for managing teachers, students, schedules, and billing — except permission control"}'::jsonb,
    updated_at = NOW()
WHERE slug = 'academy_admin';