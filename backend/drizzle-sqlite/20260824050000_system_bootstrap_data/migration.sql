INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6f413ff3-bcd6-4f25-9f15-7eda5f92780b', 'auth.login', 'auth', 'login', '{"ar":"تسجيل الدخول إلى النظام","en":"Login to system"}', '{"ar":"تسجيل الدخول إلى النظام","en":"Authentication"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('b20210a7-44c2-4773-97f1-bf7bfc25651c', 'dashboard.view', 'dashboard', 'view', '{"ar":"عرض لوحة التحكم","en":"View dashboard"}', '{"ar":"عرض لوحة التحكم","en":"Dashboard"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c7296f07-55ee-4f5b-9af4-13dc7a01dd1d', 'dashboard.view_metrics', 'dashboard', 'view_metrics', '{"ar":"عرض مؤشرات لوحة التحكم","en":"View dashboard metrics"}', '{"ar":"عرض مؤشرات لوحة التحكم","en":"Dashboard"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8ba2cef0-31ac-459a-9a02-7d6c54332a34', 'dashboard.filter_metrics', 'dashboard', 'filter_metrics', '{"ar":"فلترة مؤشرات لوحة التحكم","en":"Filter dashboard metrics"}', '{"ar":"فلترة مؤشرات لوحة التحكم","en":"Dashboard"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('015c314c-ed51-4b58-a555-844993cad70a', 'dashboard.metrics.view_all', 'dashboard', 'metrics.view_all', '{"ar":"عرض جميع مؤشرات لوحة التحكم","en":"View all dashboard metrics"}', '{"ar":"عرض جميع مؤشرات لوحة التحكم","en":"Dashboard"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('dcd0cd08-5faa-481a-9597-54bdaceaf663', 'schedule.view_list', 'schedule', 'view_list', '{"ar":"عرض قائمة الجدول اليومي","en":"View daily schedule list"}', '{"ar":"عرض قائمة الجدول اليومي","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('85fa553e-2adf-4e4b-8b17-74d164fa29cc', 'schedule.filter_advanced', 'schedule', 'filter_advanced', '{"ar":"الفلترة المتقدمة للجدول","en":"Advanced filtering of schedule"}', '{"ar":"الفلترة المتقدمة للجدول","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('07cb4c8c-93ef-4d0f-8d9b-2c6d6946282c', 'schedule.view_all', 'schedule', 'view_all', '{"ar":"عرض جميع الجداول","en":"View all schedules"}', '{"ar":"عرض جميع الجداول","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('072c78dd-cbf7-4a0d-a7e1-220700df7b00', 'schedule.view_assigned', 'schedule', 'view_assigned', '{"ar":"عرض جدول المعلم المحدد","en":"View assigned teacher schedule"}', '{"ar":"عرض جدول المعلم المحدد","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9a7935e4-19ac-4a6f-aa03-0650f56b9f71', 'schedule.view_family', 'schedule', 'view_family', '{"ar":"عرض جدول طلاب العائلة","en":"View family student schedule"}', '{"ar":"عرض جدول طلاب العائلة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a11411bc-f300-4223-8433-961650394caf', 'schedule.search_availability', 'schedule', 'search_availability', '{"ar":"البحث عن أوقات توفر المعلمين","en":"Search teacher availability"}', '{"ar":"البحث عن أوقات توفر المعلمين","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('da58c526-641f-4696-ae7f-69238d2aa877', 'schedule.manage_recurring', 'schedule', 'manage_recurring', '{"ar":"إدارة الجداول التكرارية","en":"Manage recurring schedules"}', '{"ar":"إدارة الجداول التكرارية","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('497accac-070d-4366-a8eb-3a6a1e095de0', 'schedule.dst_migrate', 'schedule', 'dst_migrate', '{"ar":"تشغيل ترحيل التوقيت الصيفي","en":"Run DST migration"}', '{"ar":"تشغيل ترحيل التوقيت الصيفي","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ba367eee-ccb6-4645-807b-268c7a954c52', 'session.view_details', 'session', 'view_details', '{"ar":"عرض تفاصيل الحصة","en":"View class details"}', '{"ar":"عرض تفاصيل الحصة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a8ee48d3-101c-4742-8e41-a1908ea5c404', 'session.activate_class', 'session', 'activate_class', '{"ar":"تفعيل الحصة خلال النافذة الزمنية","en":"Activate a class within time window"}', '{"ar":"تفعيل الحصة خلال النافذة الزمنية","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('cfe6d8c2-3a75-4ac1-97e1-e607b61a0a1b', 'session.activate_override', 'session', 'activate_override', '{"ar":"تجاوز النافذة الزمنية لتفعيل الحصة يدويًا","en":"Bypass time window enforcement to manually activate a class session"}', '{"ar":"تجاوز النافذة الزمنية لتفعيل الحصة يدويًا","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7e13b131-31ea-426d-94a3-a7e563a57ebc', 'session.update_status.start', 'session', 'update_status.start', '{"ar":"تحويل الحصة المفعلة إلى حالة قيد التشغيل عند وصول الطالب","en":"Transition an activated session to RUNNING state upon student arrival"}', '{"ar":"تحويل الحصة المفعلة إلى حالة قيد التشغيل عند وصول الطالب","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('faa4a222-2c5c-4130-bfcd-377dd88bce26', 'session.update_status.absent', 'session', 'update_status.absent', '{"ar":"تسجيل الطالب غائبًا بعد انتهاء فترة الانتظار واحتساب مستحقات المعلم","en":"Mark student as absent after waiting period and credit teacher payroll"}', '{"ar":"تسجيل الطالب غائبًا بعد انتهاء فترة الانتظار واحتساب مستحقات المعلم","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('793a8029-8126-4044-8c05-38875a5312cf', 'session.update_status.leave', 'session', 'update_status.leave', '{"ar":"معالجة إلغاء الحصة بعذر وبدء إجراءات إعادة الجدولة","en":"Process excused cancellation and trigger reschedule workflow"}', '{"ar":"معالجة إلغاء الحصة بعذر وبدء إجراءات إعادة الجدولة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a01036ce-60dd-4316-80dc-81fae301a9e1', 'session.reschedule', 'session', 'reschedule', '{"ar":"إعادة جدولة الحصة","en":"Reschedule a class"}', '{"ar":"إعادة جدولة الحصة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f2439674-3623-4248-89fd-828c9df398f3', 'session.reset', 'session', 'reset', '{"ar":"إعادة تصفير بيانات الجلسة وإرجاعها إلى حالة غير مفعلة","en":"Destructively clear session data and revert to NOT_ACTIVATED state"}', '{"ar":"إعادة تصفير بيانات الجلسة وإرجاعها إلى حالة غير مفعلة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('434a884e-5825-403b-b5bc-8c28bdccd522', 'session.override_actions', 'session', 'override_actions', '{"ar":"شريط أدوات التجاوز الإداري في صفحة تفاصيل الحصة","en":"Admin override toolbar on class details page"}', '{"ar":"شريط أدوات التجاوز الإداري في صفحة تفاصيل الحصة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3d4b1484-2441-4509-b552-df6ff2a481e1', 'dashboard.search', 'dashboard', 'search', '{"ar":"البحث الشامل في جدول المواعيد للإدارة","en":"Global search on admin schedule table"}', '{"ar":"البحث الشامل في جدول المواعيد للإدارة","en":"Dashboard"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2accab14-9b8c-41fa-afe7-59d00021e9d6', 'schedule.view_timezones', 'schedule', 'view_timezones', '{"ar":"عرض أعمدة الجداول متعددة المناطق الزمنية","en":"View multi-timezone schedule columns"}', '{"ar":"عرض أعمدة الجداول متعددة المناطق الزمنية","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('48fb6e5f-0763-4e83-b9d1-6f50394fb5e3', 'history.view_calendar', 'history', 'view_calendar', '{"ar":"عرض تقويم السجل","en":"View student class history calendar"}', '{"ar":"عرض تقويم السجل","en":"History"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ac129933-1ac4-4644-9ad4-269b2cd6337a', 'history.view_details', 'history', 'view_details', '{"ar":"عرض البيانات الوصفية للجلسة في نافذة تفاصيل السجل","en":"View session metadata in history modal drill-down"}', '{"ar":"عرض البيانات الوصفية للجلسة في نافذة تفاصيل السجل","en":"History"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fcf0f5f4-4ca3-4ecd-b3a9-5e1bd8441656', 'teacher.view_dashboard', 'teacher', 'view_dashboard', '{"ar":"الوصول إلى لوحة تحكم المعلم","en":"Access teacher dashboard"}', '{"ar":"الوصول إلى لوحة تحكم المعلم","en":"Teacher"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0aca4c1d-6b10-4d74-91c8-8e61612632b1', 'teacher.view_students', 'teacher', 'view_students', '{"ar":"عرض الطلاب التابعين للمعلم المسجل","en":"View students assigned to the logged-in teacher"}', '{"ar":"عرض الطلاب التابعين للمعلم المسجل","en":"Teacher"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f77687a1-5230-474d-ad1b-dc23f3af4eac', 'system.enforce_time_window', 'system', 'enforce_time_window', '{"ar":"التحقق من النافذة الزمنية للتفعيل","en":"Validate activation time window"}', '{"ar":"التحقق من النافذة الزمنية للتفعيل","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f453ea6d-8b01-4626-947d-1e81eb986a45', 'system.enforce_leave_limit', 'system', 'enforce_leave_limit', '{"ar":"التحقق على مستوى النظام لقيود رصيد إجازات المعلم شهريًا","en":"System-level validation gate that enforces teacher leave quota limits per calendar month"}', '{"ar":"التحقق على مستوى النظام لقيود رصيد إجازات المعلم شهريًا","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fa3a97b9-5c5c-45ff-9b47-e9389f701b7d', 'teachers.list', 'teachers', 'list', '{"ar":"عرض قائمة المعلمين","en":"List teachers"}', '{"ar":"عرض قائمة المعلمين","en":"Teachers"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c3d9c303-abf8-4849-b66b-87c85844143b', 'teachers.create', 'teachers', 'create', '{"ar":"إنشاء حسابات المعلمين","en":"Create teacher accounts"}', '{"ar":"إنشاء حسابات المعلمين","en":"Teachers"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ee045c2b-4018-4ed8-9d8b-a6fb8ab4cdb6', 'teachers.edit', 'teachers', 'edit', '{"ar":"تعديل ملفات المعلمين","en":"Edit teacher profiles"}', '{"ar":"تعديل ملفات المعلمين","en":"Teachers"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('052375be-39ed-4ff8-a8c9-36316ee28267', 'teachers.manage_schedule', 'teachers', 'manage_schedule', '{"ar":"إدارة جداول المعلمين","en":"Manage teacher schedules"}', '{"ar":"إدارة جداول المعلمين","en":"Teachers"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('533129f5-2d88-4fa8-8d80-8ba9db73987f', 'staff.view_directory', 'staff', 'view_directory', '{"ar":"الوصول إلى دليل المعلمين العام مع المؤشرات والجدول","en":"Access the global Teachers Directory with summary metrics and data table"}', '{"ar":"الوصول إلى دليل المعلمين العام مع المؤشرات والجدول","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1c9db6bb-a5d7-44ad-a1d1-35029dbeca61', 'schedule.view_weekly', 'schedule', 'view_weekly', '{"ar":"عرض الجدول الأسبوعي للمعلم كشبكة زمنية ملونة","en":"View a specific teacher weekly calendar grid with colored time-blocks"}', '{"ar":"عرض الجدول الأسبوعي للمعلم كشبكة زمنية ملونة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('10b2afbf-e7c6-4f85-8d27-d2b057106847', 'schedule.view_workload', 'schedule', 'view_workload', '{"ar":"عرض مؤشرات عبء العمل الأسبوعي وساعات العمل","en":"View aggregated weekly capacity metrics (Weekly hours worked)"}', '{"ar":"عرض مؤشرات عبء العمل الأسبوعي وساعات العمل","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1a9f13d1-9687-4de2-86b2-3da2d82cfb55', 'schedule.create_class', 'schedule', 'create_class', '{"ar":"إنشاء حصص جديدة وإضافتها لجدول المواعيد التكراري","en":"Access the Add Class workflow and create new recurring scheduled sessions"}', '{"ar":"إنشاء حصص جديدة وإضافتها لجدول المواعيد التكراري","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9c419354-5f83-4493-9ecf-b3d18c6a3376', 'parents.list', 'parents', 'list', '{"ar":"عرض قائمة أولياء الأمور","en":"List parents"}', '{"ar":"عرض قائمة أولياء الأمور","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a75adf3f-5b0f-4b5a-8d1c-b2f2e6e5b548', 'parents.create', 'parents', 'create', '{"ar":"إنشاء حسابات أولياء الأمور","en":"Create parent accounts"}', '{"ar":"إنشاء حسابات أولياء الأمور","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c1b2c070-c408-4342-b1d3-506479fc07b8', 'parents.edit', 'parents', 'edit', '{"ar":"تعديل ملفات أولياء الأمور","en":"Edit parent profiles"}', '{"ar":"تعديل ملفات أولياء الأمور","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3c2b894f-e323-4465-a911-14e693cf8013', 'students.list', 'students', 'list', '{"ar":"عرض قائمة الطلاب","en":"List students"}', '{"ar":"عرض قائمة الطلاب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('aefcc5ff-0748-4730-ad18-f39b71e7b65f', 'students.create', 'students', 'create', '{"ar":"إنشاء ملفات الطلاب","en":"Create student profiles"}', '{"ar":"إنشاء ملفات الطلاب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0806e2d1-ba5b-437e-ab8f-bb806d637508', 'students.edit', 'students', 'edit', '{"ar":"تعديل ملفات الطلاب","en":"Edit student profiles"}', '{"ar":"تعديل ملفات الطلاب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('60b4a39e-3acc-4f52-af7c-4a4a62e7f457', 'students.change_teacher', 'students', 'change_teacher', '{"ar":"إعادة تعيين معلم الطالب","en":"Reassign student teacher"}', '{"ar":"إعادة تعيين معلم الطالب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ac6bfc38-a4b5-4549-81ef-093762eeccf6', 'students.change_status', 'students', 'change_status', '{"ar":"تغيير حالة الطالب","en":"Change student status"}', '{"ar":"تغيير حالة الطالب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('cf8610d3-615d-4d78-b1e9-247fc9b83a3e', 'students.override_quota', 'students', 'override_quota', '{"ar":"تجاوز حصة حصص الطالب","en":"Override student class quota"}', '{"ar":"تجاوز حصة حصص الطالب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4dbf590b-8df2-4e4f-aaa9-1c2ab595d419', 'invoices.list', 'invoices', 'list', '{"ar":"عرض قائمة الفواتير","en":"List invoices"}', '{"ar":"عرض قائمة الفواتير","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('96030e1e-3375-462e-b22c-1d9a175ec443', 'invoices.delete', 'invoices', 'delete', '{"ar":"حذف الفواتير","en":"Delete invoices"}', '{"ar":"حذف الفواتير","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('00c21be7-1123-45cf-aef1-b22bb106734e', 'invoices.create', 'invoices', 'create', '{"ar":"إنشاء الفواتير","en":"Create invoices"}', '{"ar":"إنشاء الفواتير","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7a34f427-840c-4558-89a0-4570246278c1', 'invoices.mark_paid', 'invoices', 'mark_paid', '{"ar":"تحديد الفاتورة كمدفوعة","en":"Mark invoice as paid"}', '{"ar":"تحديد الفاتورة كمدفوعة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('734a1cf2-9c0a-4780-adf2-3c216a099a57', 'invoices.edit', 'invoices', 'edit', '{"ar":"تعديل الفواتير","en":"Edit invoices"}', '{"ar":"تعديل الفواتير","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('626d9f22-10e0-42a0-963c-c1c00a58b310', 'resources.list', 'resources', 'list', '{"ar":"عرض قائمة الموارد التعليمية","en":"List learning resources"}', '{"ar":"عرض قائمة الموارد التعليمية","en":"Resources"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1f1a5703-2682-407c-ab00-0360c6beb14d', 'resources.delete', 'resources', 'delete', '{"ar":"حذف الموارد التعليمية","en":"Delete learning resources"}', '{"ar":"حذف الموارد التعليمية","en":"Resources"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('e0dddb5e-2980-4adc-b2de-b2e67b4ab4cd', 'resources.upload', 'resources', 'upload', '{"ar":"رفع الموارد التعليمية","en":"Upload learning resources"}', '{"ar":"رفع الموارد التعليمية","en":"Resources"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6cbdc8b8-ce4f-48f0-bc93-5e2a5c8f96be', 'reports.generate', 'reports', 'generate', '{"ar":"إنشاء التقارير","en":"Generate reports"}', '{"ar":"إنشاء التقارير","en":"Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8c7405c4-3d36-4b3c-8d63-51cbb2a1d46c', 'report.generate_custom', 'report', 'generate_custom', '{"ar":"الوصول إلى واجهة التقارير ومحرك الاستعلامات الديناميكي لتقييم المؤشرات التشغيلية.","en":"Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters."}', '{"ar":"الوصول إلى واجهة التقارير ومحرك الاستعلامات الديناميكي لتقييم المؤشرات التشغيلية.","en":"Reporting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3ea8db5f-b79d-43c6-aa00-7cc2a7cbad80', 'report.view_financials', 'report', 'view_financials', '{"ar":"حساب وعرض المؤشرات المالية والرواتب الحساسة في التقارير المحدثة.","en":"Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports."}', '{"ar":"حساب وعرض المؤشرات المالية والرواتب الحساسة في التقارير المحدثة.","en":"Reporting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('17d84836-df42-4e7f-b305-93f7d6f6fc64', 'complaints.list', 'complaints', 'list', '{"ar":"عرض قائمة الشكاوى","en":"List complaints"}', '{"ar":"عرض قائمة الشكاوى","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0382db77-329e-4cfa-90a7-5ff1a42d8318', 'complaints.delete', 'complaints', 'delete', '{"ar":"حذف الشكاوى","en":"Delete complaints"}', '{"ar":"حذف الشكاوى","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('afd0dd76-5e25-4a22-baeb-7ab2722d7b92', 'complaints.respond', 'complaints', 'respond', '{"ar":"الرد على الشكاوى","en":"Respond to complaints"}', '{"ar":"الرد على الشكاوى","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d3499ecb-e6b6-4a72-a4b4-4bde4bc22510', 'support.submit_complaint', 'support', 'submit_complaint', '{"ar":"تقديم شكوى جديدة من لوحة تحكم ولي الأمر","en":"Submit a new complaint from the parent dashboard"}', '{"ar":"تقديم شكوى جديدة من لوحة تحكم ولي الأمر","en":"Support"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('71278577-515e-4854-bd80-b05907fdc924', 'support.view_history', 'support', 'view_history', '{"ar":"عرض سجل الشكاوى المقدمة الخاصة بولي الأمر","en":"View own complaint submission history as a parent"}', '{"ar":"عرض سجل الشكاوى المقدمة الخاصة بولي الأمر","en":"Support"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('11d7e564-3ab8-4980-b259-20e54ee971a2', 'communication.submit_suggestion', 'communication', 'submit_suggestion', '{"ar":"تقديم اقتراح جديد من لوحة تحكم ولي الأمر","en":"Submit a new suggestion from the parent dashboard"}', '{"ar":"تقديم اقتراح جديد من لوحة تحكم ولي الأمر","en":"Communication"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('239e7836-7919-4307-901c-93cbcd6666a8', 'system.dispatch_email', 'system', 'dispatch_email', '{"ar":"صلاحية داخلية تسمح للنظام بإرسال الإشعارات عبر البريد الإلكتروني","en":"Internal permission allowing the system to dispatch outbound email notifications"}', '{"ar":"صلاحية داخلية تسمح للنظام بإرسال الإشعارات عبر البريد الإلكتروني","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('79ca4933-99ac-4656-8d14-ace47fc99397', 'staff.list', 'staff', 'list', '{"ar":"عرض قائمة حسابات الموظفين","en":"List staff accounts"}', '{"ar":"عرض قائمة حسابات الموظفين","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8526786a-7cb0-44a4-88c9-3c17aeb1b934', 'staff.create', 'staff', 'create', '{"ar":"إنشاء حسابات الموظفين","en":"Create staff accounts"}', '{"ar":"إنشاء حسابات الموظفين","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('54bca7e7-1cd1-4f9f-8533-dcf403bb9f3b', 'staff.edit', 'staff', 'edit', '{"ar":"تعديل حسابات الموظفين","en":"Edit staff accounts"}', '{"ar":"تعديل حسابات الموظفين","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('085b0359-b76a-4c1b-972c-1c9477d4fcb1', 'permission_groups.manage', 'permission_groups', 'manage', '{"ar":"إدارة مجموعات الصلاحيات","en":"Manage permission groups"}', '{"ar":"إدارة مجموعات الصلاحيات","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6225570a-cbbd-40ef-8418-a7a005acf51f', 'permission_groups.assign', 'permission_groups', 'assign', '{"ar":"تعيين مجموعات الصلاحيات للمستخدمين","en":"Assign permission groups to users"}', '{"ar":"تعيين مجموعات الصلاحيات للمستخدمين","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6874a759-c625-4e34-9b9d-d13abe26bef4', 'notification.view_alerts', 'notification', 'view_alerts', '{"ar":"عرض واجهة الإشعارات العامة مع تنبيهات النظام","en":"Access global notifications UI with system alerts"}', '{"ar":"عرض واجهة الإشعارات العامة مع تنبيهات النظام","en":"Notifications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('071aab02-3df2-4e7c-9d1b-2a83c31dde33', 'billing.view_unpaid_invoices', 'billing', 'view_unpaid_invoices', '{"ar":"عرض الحسابات ذات الأرصدة المالية المعلقة أو المتأخرة","en":"View accounts with pending or overdue financial balances"}', '{"ar":"عرض الحسابات ذات الأرصدة المالية المعلقة أو المتأخرة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3365c08d-2569-4f39-b99e-fd574a8178f8', 'schedule.delete_class', 'schedule', 'delete_class', '{"ar":"حذف حصة تكرارية معينة من جدول المعلم","en":"Delete a specific recurring class block from a teacher schedule"}', '{"ar":"حذف حصة تكرارية معينة من جدول المعلم","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0d55fc9d-a1a4-4f9a-b1eb-1729fabaf205', 'schedule.clear_weekly', 'schedule', 'clear_weekly', '{"ar":"مسح الجدول الأسبوعي للمعلم بالكامل دفعة واحدة","en":"Bulk erase a teacher entire weekly schedule in a single action"}', '{"ar":"مسح الجدول الأسبوعي للمعلم بالكامل دفعة واحدة","en":"Scheduling"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fb1d41f5-5735-4755-8f8e-467a0b6cef22', 'system.bulk_update_dst', 'system', 'bulk_update_dst', '{"ar":"تنفيذ خوارزمية تعديل التوقيت الصيفي الشاملة في قاعدة البيانات","en":"Execute global DST adjustment algorithm across entire database"}', '{"ar":"تنفيذ خوارزمية تعديل التوقيت الصيفي الشاملة في قاعدة البيانات","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('eba9dcc2-2cbf-44d9-b7f9-18b1db83444b', 'parent.view_directory', 'parent', 'view_directory', '{"ar":"الوصول إلى دليل أولياء الأمور العام مع مؤشرات الفواتير","en":"Access global Parents Directory with status metrics and unpaid invoices"}', '{"ar":"الوصول إلى دليل أولياء الأمور العام مع مؤشرات الفواتير","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('aaeca11b-31e2-48e7-9305-67fe10519cb9', 'parent.view_students', 'parent', 'view_students', '{"ar":"عرض الطلاب التابعين لولي الأمر المسجل","en":"View students assigned to the logged-in parent"}', '{"ar":"عرض الطلاب التابعين لولي الأمر المسجل","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8d27a158-6ff4-4487-abdb-c663089dc1ca', 'parent.manage_status', 'parent', 'manage_status', '{"ar":"Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED","en":"Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED"}', '{"ar":"أولياء الأمور","en":"Parents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ef555a4a-b974-463f-934f-a9800c821efb', 'student.view_associated', 'student', 'view_associated', '{"ar":"عرض قائمة الطلاب المرتبطين بولي أمر معين مع بيانات المعلم والرصيد","en":"View the aggregated list of students associated with a specific parent, including teacher and quota data"}', '{"ar":"عرض قائمة الطلاب المرتبطين بولي أمر معين مع بيانات المعلم والرصيد","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('653dfb63-684e-410e-9577-649b27160002', 'student.edit_quota', 'student', 'edit_quota', '{"ar":"Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers","en":"Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers"}', '{"ar":"الطلاب","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('54caf17d-a9f8-4ddb-8863-9807c4b27a22', 'billing.view_history', 'billing', 'view_history', '{"ar":"عرض سجل الفواتير الكامل لولي الأمر شاملة المدفوعة وغير المدفوعة","en":"Access the full invoice ledger for a single parent, including paid and unpaid invoices"}', '{"ar":"عرض سجل الفواتير الكامل لولي الأمر شاملة المدفوعة وغير المدفوعة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('86e4a01b-ae9f-465e-9278-57faacaf29b3', 'document.manage_parent_docs', 'document', 'manage_parent_docs', '{"ar":"إرفاق وعرض المستندات الخارجية (العقود، الهوية) المرتبطة بولي الأمر","en":"Attach and view external files (contracts, ID verification) linked to a specific Parent record"}', '{"ar":"إرفاق وعرض المستندات الخارجية (العقود، الهوية) المرتبطة بولي الأمر","en":"Documents"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2c6c8ddc-e45f-4c27-84da-9e32e24ed12b', 'billing.create_invoice', 'billing', 'create_invoice', '{"ar":"إنشاء فاتورة مخصصة يدويًا خارج دورة تجديد الباقة الآلية","en":"Manually generate a custom invoice outside the automated package renewal cycle"}', '{"ar":"إنشاء فاتورة مخصصة يدويًا خارج دورة تجديد الباقة الآلية","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('25917325-1442-4f1b-b858-9f1b0111ad7b', 'billing.update_status_paid', 'billing', 'update_status_paid', '{"ar":"التحقق يدويًا وتسجيل تسوية الفاتورة المستحقة كمدفوعة","en":"Manually verify and log the settlement of an outstanding invoice by marking it as Paid"}', '{"ar":"التحقق يدويًا وتسجيل تسوية الفاتورة المستحقة كمدفوعة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2761c803-8555-45d0-99aa-78567b769ca2', 'billing.submit_payment_proof', 'billing', 'submit_payment_proof', '{"ar":"تقديم إثبات الدفع للفاتورة المستحقة على حساب ولي الأمر","en":"Submit payment proof for an outstanding invoice on the parent account"}', '{"ar":"تقديم إثبات الدفع للفاتورة المستحقة على حساب ولي الأمر","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('15e38efb-f710-4b09-a5c8-d6eaf93c0152', 'billing.delete_invoice', 'billing', 'delete_invoice', '{"ar":"حذف السجل المالي من دفتر فوترة ولي الأمر","en":"Destructively remove a financial record from the parent billing ledger"}', '{"ar":"حذف السجل المالي من دفتر فوترة ولي الأمر","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1f11448c-7654-475f-838f-aa3c154c6d78', 'student.reassign_teacher', 'student', 'reassign_teacher', '{"ar":"تغيير المعلم المعين للطالب ديناميكيًا من ملف ولي الأمر","en":"Dynamically change a student assigned instructor from the parent profile view"}', '{"ar":"تغيير المعلم المعين للطالب ديناميكيًا من ملف ولي الأمر","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('303ea0c8-594a-4f40-a6ba-2c50617138ca', 'student.manage_status', 'student', 'manage_status', '{"ar":"تعديل حالة تسجيل الطالب (منتظم، في إجازة، معلق) من ملف ولي الأمر","en":"Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile"}', '{"ar":"تعديل حالة تسجيل الطالب (منتظم، في إجازة، معلق) من ملف ولي الأمر","en":"Students"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7b588f31-3ef6-42e9-a874-ddec713b86cd', 'system.sync_notifications', 'system', 'sync_notifications', '{"ar":"قاعدة داخلية لمزامنة الإشعارات العامة مع تغييرات الفوترة الفورية","en":"Internal rule that forces the global notification tray to reflect real-time billing changes"}', '{"ar":"قاعدة داخلية لمزامنة الإشعارات العامة مع تغييرات الفوترة الفورية","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c744708b-b6a3-4df6-afb3-998a2c2073fb', 'system.enforce_suspended_lock', 'system', 'enforce_suspended_lock', '{"ar":"قاعدة آلية لتقييد عناصر واجهة جدول المعلم عندما يكون الطالب معلقًا","en":"Automated rule that locks UI controls on teacher schedule when student is Suspended"}', '{"ar":"قاعدة آلية لتقييد عناصر واجهة جدول المعلم عندما يكون الطالب معلقًا","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('5108d7bc-de71-4ed3-9c2c-85f770875e00', 'system.process_student_leave', 'system', 'process_student_leave', '{"ar":"سير عمل آلي لتسجيل الحصص القادمة كمعذورة وإدراجها لإعادة الجدولة عند إجازة الطالب","en":"Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave"}', '{"ar":"سير عمل آلي لتسجيل الحصص القادمة كمعذورة وإدراجها لإعادة الجدولة عند إجازة الطالب","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8cadb2f1-c251-40f7-963a-5cd937154a66', 'system.restrict_resource_access', 'system', 'restrict_resource_access', '{"ar":"تطبيق عزل تخزين الموارد التعليمية عن الوصول غير المصرح","en":"Enforce isolation of learning resources storage from unauthorized external access"}', '{"ar":"تطبيق عزل تخزين الموارد التعليمية عن الوصول غير المصرح","en":"System"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('29dd785b-fbf2-4276-88b9-367b7dbc7fc5', 'suggestions.list', 'suggestions', 'list', '{"ar":"عرض وفلترة جميع اقتراحات أولياء الأمور وحالة مراجعتها","en":"List and filter all parent suggestions with review status and duplicate grouping"}', '{"ar":"عرض وفلترة جميع اقتراحات أولياء الأمور وحالة مراجعتها","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('39f6c6f5-b78d-4240-b225-bb6fe2aa7c44', 'suggestions.review', 'suggestions', 'review', '{"ar":"مراجعة الاقتراح: تحديده كمراجع مع رد الإدارة أو كمكرر","en":"Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion"}', '{"ar":"مراجعة الاقتراح: تحديده كمراجع مع رد الإدارة أو كمكرر","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fd42c055-08b3-418d-8320-041284eadb2d', 'suggestions.delete', 'suggestions', 'delete', '{"ar":"الحذف الخفيف لسجل الاقتراح من النظام","en":"Soft-delete a suggestion record from the system"}', '{"ar":"الحذف الخفيف لسجل الاقتراح من النظام","en":"Communications"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2d3e020b-287d-4239-8c3d-585316271680', 'subjects.list', 'subjects', 'list', '{"ar":"عرض قائمة المواد الدراسية","en":"List class subjects"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('dbc6b0f0-b6fa-4398-94cf-1e01d42d1779', 'subjects.create', 'subjects', 'create', '{"ar":"إنشاء مادة دراسية","en":"Create class subjects"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7f20b0de-5d45-4edb-b77d-b49c4eb7830f', 'subjects.update', 'subjects', 'update', '{"ar":"تعديل مادة دراسية","en":"Update class subjects"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('5afa6ed4-94d8-4f3e-bb9c-faf71e40303b', 'subjects.delete', 'subjects', 'delete', '{"ar":"حذف مادة دراسية","en":"Delete class subjects"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('67192dfa-1af7-4b29-80c5-becbcac51199', 'subjects.view_resources', 'subjects', 'view_resources', '{"ar":"عرض موارد المادة الدراسية","en":"View subject resources"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('bb6058a1-d32f-4a67-9273-cb46edacfb95', 'subjects.manage_resources', 'subjects', 'manage_resources', '{"ar":"ربط وإلغاء ربط موارد المادة الدراسية","en":"Attach and detach subject resources"}', '{"ar":"المواد الدراسية","en":"Subjects"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('b50f4f53-e4c2-4d77-88ed-180a2c0ac230', 'categories.list', 'categories', 'list', '{"ar":"عرض قائمة الفئات الدراسية","en":"List class categories"}', '{"ar":"الفئات الدراسية","en":"Categories"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('500f01a3-ec81-4cb0-8b5c-d06defd2a691', 'categories.create', 'categories', 'create', '{"ar":"إنشاء فئة دراسية","en":"Create class categories"}', '{"ar":"الفئات الدراسية","en":"Categories"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f7dbe260-7313-4e02-8786-88cfb8af347c', 'categories.update', 'categories', 'update', '{"ar":"تعديل فئة دراسية","en":"Update class categories"}', '{"ar":"الفئات الدراسية","en":"Categories"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8c159566-617e-4ed1-a3ef-49ab973c4b13', 'categories.delete', 'categories', 'delete', '{"ar":"حذف فئة دراسية","en":"Delete class categories"}', '{"ar":"الفئات الدراسية","en":"Categories"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f4ff99f1-23c1-421a-bcf2-a2fac33fd5fe', 'notes.list', 'notes', 'list', '{"ar":"عرض قائمة الملاحظات الهامة للمعلم","en":"List teacher important notes"}', '{"ar":"الملاحظات","en":"Notes"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c8305fb5-9bbd-43d0-8839-ef4e090993ef', 'notes.create', 'notes', 'create', '{"ar":"إنشاء ملاحظة هامة للمعلم","en":"Create teacher important notes"}', '{"ar":"الملاحظات","en":"Notes"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('bc36d8da-a025-4b21-a835-ad9cd7c57b31', 'notes.update', 'notes', 'update', '{"ar":"تعديل ملاحظة هامة للمعلم","en":"Update teacher important notes"}', '{"ar":"الملاحظات","en":"Notes"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4b726a84-e8b7-491f-9321-23100490b426', 'notes.delete', 'notes', 'delete', '{"ar":"حذف ملاحظة هامة للمعلم","en":"Delete teacher important notes"}', '{"ar":"الملاحظات","en":"Notes"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c8d8e139-0e3f-4f31-98ed-01130c45d72f', 'billing.view_exchange_rates', 'billing', 'view_exchange_rates', '{"ar":"عرض أسعار صرف العملات وآخر حالة مزامنة","en":"View currency exchange rates and latest sync status"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d53efdae-120f-493e-b1b5-f085de017b83', 'billing.refresh_exchange_rates', 'billing', 'refresh_exchange_rates', '{"ar":"تشغيل مزامنة أسعار صرف العملات يدوياً","en":"Trigger manual currency exchange rate refresh"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8812f9f6-0c04-45e2-8d9f-1024c89f020e', 'billing.manage_fx_provider', 'billing', 'manage_fx_provider', '{"ar":"إدارة مزود أسعار صرف العملات","en":"Manage FX rate provider configuration"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f1ee1ea6-4132-4a32-967e-58051095878b', 'billing.override_exchange_rates', 'billing', 'override_exchange_rates', '{"ar":"تجاوز أسعار صرف العملات يدوياً","en":"Manually override currency exchange rates"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('91cf988f-5116-4893-b59b-4b3dbcc43e5d', 'billing.manage_currency_hedges', 'billing', 'manage_currency_hedges', '{"ar":"إدارة تحوطات العملات","en":"Manage currency hedge positions"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2c3a3c35-f448-4418-93fb-5ad5ab68a015', 'billing.manage_currencies', 'billing', 'manage_currencies', '{"ar":"تفعيل وإلغاء تفعيل العملات المدعومة في الكتالوج","en":"Activate and deactivate supported currencies in the catalog"}', '{"ar":"الفوترة","en":"Billing"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8ba8d60d-79a9-45be-92b6-39502686ac1a', 'payment_methods.manage_catalogs', 'payment_methods', 'manage_catalogs', '{"ar":"إدارة كتالوج طرق الدفع (المحافظ، الروابط، الحسابات الإلكترونية)","en":"Manage payment method catalog entries (wallets, links, online accounts)"}', '{"ar":"طرق الدفع","en":"Payment Methods"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2ef4c721-6901-4a80-a1b0-e7336eda19cf', 'payment_methods.verify_bank_transfer', 'payment_methods', 'verify_bank_transfer', '{"ar":"التحقق من طرق التحويل البنكي بعد المراجعة اليدوية","en":"Verify bank transfer payment methods after manual review"}', '{"ar":"طرق الدفع","en":"Payment Methods"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7b129c3d-3d6d-428c-bded-0192c50d02aa', 'meeting_providers.manage_catalog', 'meeting_providers', 'manage_catalog', '{"ar":"إدارة كتالوج مزودي الاجتماعات","en":"Manage meeting provider catalog entries"}', '{"ar":"الاجتماعات","en":"Meeting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('66c15203-362a-44a3-932d-7817cad5a535', 'meeting_configs.manage_own', 'meeting_configs', 'manage_own', '{"ar":"إدارة إعدادات الاجتماعات الخاصة","en":"Manage own online meeting configurations"}', '{"ar":"الاجتماعات","en":"Meeting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('64ff97a0-91fb-4c13-abd5-37c6c84742ad', 'meeting_configs.manage_other', 'meeting_configs', 'manage_other', '{"ar":"إدارة إعدادات اجتماعات المستخدمين الآخرين","en":"Manage other users online meeting configurations"}', '{"ar":"الاجتماعات","en":"Meeting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7c4cd027-cd7d-4764-9c35-68830732fe2f', 'meeting_configs.manage_class', 'meeting_configs', 'manage_class', '{"ar":"إدارة إعدادات الاجتماعات على مستوى الحصة","en":"Manage class-scoped online meeting configurations"}', '{"ar":"الاجتماعات","en":"Meeting"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6c03b680-2c93-4799-a335-9cb8d489230f', 'profile.core_identity.view_own', 'profile', 'core_identity.view_own', '{"ar":"عرض core identity الخاص","en":"View own core identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('95c4de0d-5b7b-40f4-85c2-fe74f5037075', 'profile.core_identity.view_other', 'profile', 'core_identity.view_other', '{"ar":"عرض core identity للآخرين","en":"View other users core identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fb7da1b7-c4aa-4f9d-b5c2-7609457a296a', 'profile.core_identity.edit_own', 'profile', 'core_identity.edit_own', '{"ar":"تعديل core identity الخاص","en":"Edit own core identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ab263570-35a3-486e-8f94-6d11fa50e53a', 'profile.core_identity.edit_other', 'profile', 'core_identity.edit_other', '{"ar":"تعديل core identity للآخرين","en":"Edit other users core identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('432d22c8-31b8-4132-956d-a7e64d26565f', 'profile.core_contact.view_own', 'profile', 'core_contact.view_own', '{"ar":"عرض core contact الخاص","en":"View own core contact"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('64fb760f-9584-45c8-a703-f21c89283511', 'profile.core_contact.view_other', 'profile', 'core_contact.view_other', '{"ar":"عرض core contact للآخرين","en":"View other users core contact"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('45b1a10a-079d-498e-b59c-da1455a3f627', 'profile.core_contact.edit_own', 'profile', 'core_contact.edit_own', '{"ar":"تعديل core contact الخاص","en":"Edit own core contact"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0555951b-bd15-4f95-b0e6-025e6c5113f9', 'profile.core_contact.edit_other', 'profile', 'core_contact.edit_other', '{"ar":"تعديل core contact للآخرين","en":"Edit other users core contact"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('7eb6d5d4-ec3d-4003-abfa-acf6690d4637', 'profile.teacher_professional.view_own', 'profile', 'teacher_professional.view_own', '{"ar":"عرض teacher professional الخاص","en":"View own teacher professional"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('662dc494-48c2-4499-bb52-c55ab61a2125', 'profile.teacher_professional.view_other', 'profile', 'teacher_professional.view_other', '{"ar":"عرض teacher professional للآخرين","en":"View other users teacher professional"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9c205f8f-eb1c-4622-9158-0ddc3c79c9a6', 'profile.teacher_professional.edit_own', 'profile', 'teacher_professional.edit_own', '{"ar":"تعديل teacher professional الخاص","en":"Edit own teacher professional"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d838dc05-9231-4808-855c-ea53bd4a32ce', 'profile.teacher_professional.edit_other', 'profile', 'teacher_professional.edit_other', '{"ar":"تعديل teacher professional للآخرين","en":"Edit other users teacher professional"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f5cbd860-d5fe-4361-9d06-63bb3b681734', 'profile.teacher_identity.view_own', 'profile', 'teacher_identity.view_own', '{"ar":"عرض teacher identity الخاص","en":"View own teacher identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('da19aa6e-2e2f-4b03-9ac5-8d1d32395d1b', 'profile.teacher_identity.view_other', 'profile', 'teacher_identity.view_other', '{"ar":"عرض teacher identity للآخرين","en":"View other users teacher identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3f1a36d7-1746-4ebd-8d10-06049c183db4', 'profile.teacher_identity.edit_own', 'profile', 'teacher_identity.edit_own', '{"ar":"تعديل teacher identity الخاص","en":"Edit own teacher identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('27cf1f31-ec59-4a7e-ae92-b94722be2b5a', 'profile.teacher_identity.edit_other', 'profile', 'teacher_identity.edit_other', '{"ar":"تعديل teacher identity للآخرين","en":"Edit other users teacher identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('99c4f50f-5efd-4bec-a1b1-880cb858167d', 'profile.parent_social.view_own', 'profile', 'parent_social.view_own', '{"ar":"عرض parent social الخاص","en":"View own parent social"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('54197d51-6c77-4f07-82ed-0381804e939c', 'profile.parent_social.view_other', 'profile', 'parent_social.view_other', '{"ar":"عرض parent social للآخرين","en":"View other users parent social"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('aeebfc2f-26f9-41a7-bbf6-5a4f2e9359d8', 'profile.parent_social.edit_own', 'profile', 'parent_social.edit_own', '{"ar":"تعديل parent social الخاص","en":"Edit own parent social"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c95feb66-fd28-49a4-9600-282bf2615b81', 'profile.parent_social.edit_other', 'profile', 'parent_social.edit_other', '{"ar":"تعديل parent social للآخرين","en":"Edit other users parent social"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a03b5dcd-191f-492b-81db-f061d4a173a6', 'profile.parent_identity.view_own', 'profile', 'parent_identity.view_own', '{"ar":"عرض parent identity الخاص","en":"View own parent identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('319036c4-0da2-4afd-9b02-bd479658f58d', 'profile.parent_identity.view_other', 'profile', 'parent_identity.view_other', '{"ar":"عرض parent identity للآخرين","en":"View other users parent identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('85344324-04eb-4dab-afed-d1f15ae129e0', 'profile.parent_identity.edit_own', 'profile', 'parent_identity.edit_own', '{"ar":"تعديل parent identity الخاص","en":"Edit own parent identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9b9fd32b-bd1e-445d-8bc3-be4c8f3781db', 'profile.parent_identity.edit_other', 'profile', 'parent_identity.edit_other', '{"ar":"تعديل parent identity للآخرين","en":"Edit other users parent identity"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('df487509-f946-4132-847f-6d37c955d097', 'profile.parent_billing.view_own', 'profile', 'parent_billing.view_own', '{"ar":"عرض parent billing الخاص","en":"View own parent billing"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4975780a-4647-4944-af2b-4cbe904898e8', 'profile.parent_billing.view_other', 'profile', 'parent_billing.view_other', '{"ar":"عرض parent billing للآخرين","en":"View other users parent billing"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6956cefe-9837-4286-a12d-be2167d26e43', 'profile.parent_billing.edit_own', 'profile', 'parent_billing.edit_own', '{"ar":"تعديل parent billing الخاص","en":"Edit own parent billing"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('cac4c741-75ea-462e-a918-33bf5de8068a', 'profile.parent_billing.edit_other', 'profile', 'parent_billing.edit_other', '{"ar":"تعديل parent billing للآخرين","en":"Edit other users parent billing"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9f86a8bc-20dd-4d47-80c4-739896eadbc1', 'profile.parent_account.view_own', 'profile', 'parent_account.view_own', '{"ar":"عرض parent account الخاص","en":"View own parent account"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('194862ab-050b-4552-a66e-4338b1a44b99', 'profile.parent_account.view_other', 'profile', 'parent_account.view_other', '{"ar":"عرض parent account للآخرين","en":"View other users parent account"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3dbbe42f-5513-454c-b689-7adbfc37dac7', 'profile.parent_account.edit_own', 'profile', 'parent_account.edit_own', '{"ar":"تعديل parent account الخاص","en":"Edit own parent account"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3569eacb-c54e-4021-a673-c388a6a296f0', 'profile.parent_account.edit_other', 'profile', 'parent_account.edit_other', '{"ar":"تعديل parent account للآخرين","en":"Edit other users parent account"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('bc16d47a-e835-4dd8-b46a-d6f0d425cbca', 'profile.parent_students.view_own', 'profile', 'parent_students.view_own', '{"ar":"عرض parent students الخاص","en":"View own parent students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0de58aac-17c0-46c5-b4cf-c5e3b2dc8d80', 'profile.parent_students.view_other', 'profile', 'parent_students.view_other', '{"ar":"عرض parent students للآخرين","en":"View other users parent students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8d96e872-f2c5-4681-bae6-e855b444cb9c', 'profile.parent_students.edit_own', 'profile', 'parent_students.edit_own', '{"ar":"تعديل parent students الخاص","en":"Edit own parent students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('a4ce93a6-97cb-4f41-96db-7770bc72a7e5', 'profile.parent_students.edit_other', 'profile', 'parent_students.edit_other', '{"ar":"تعديل parent students للآخرين","en":"Edit other users parent students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('35e80138-5ed7-42ee-9ebd-3207d854dbee', 'profile.teacher_students.view_own', 'profile', 'teacher_students.view_own', '{"ar":"عرض teacher students الخاص","en":"View own teacher students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('aa66c44d-e333-4758-8b31-a5e7d50597d9', 'profile.teacher_students.view_other', 'profile', 'teacher_students.view_other', '{"ar":"عرض teacher students للآخرين","en":"View other users teacher students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('916eeb3e-dd0d-43de-acd9-cd4ff51fe591', 'profile.teacher_students.edit_own', 'profile', 'teacher_students.edit_own', '{"ar":"تعديل teacher students الخاص","en":"Edit own teacher students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4ac71221-473d-41ae-bb47-0437f9d1ee8c', 'profile.teacher_students.edit_other', 'profile', 'teacher_students.edit_other', '{"ar":"تعديل teacher students للآخرين","en":"Edit other users teacher students"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('cc21437a-a727-41b5-b5b9-4a67b99978df', 'profile.staff_role.view_own', 'profile', 'staff_role.view_own', '{"ar":"عرض staff role الخاص","en":"View own staff role"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4220598e-f15e-4ba7-9656-f0f348f4feb6', 'profile.staff_role.view_other', 'profile', 'staff_role.view_other', '{"ar":"عرض staff role للآخرين","en":"View other users staff role"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('11d3abf1-74cc-4af0-8bf1-41c333e7ff54', 'profile.staff_role.edit_own', 'profile', 'staff_role.edit_own', '{"ar":"تعديل staff role الخاص","en":"Edit own staff role"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f2c4def1-5188-4d6e-95df-bab1fa9b67be', 'profile.staff_role.edit_other', 'profile', 'staff_role.edit_other', '{"ar":"تعديل staff role للآخرين","en":"Edit other users staff role"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('e6aca145-3ff4-48ea-97e3-8172fefe2a63', 'profile.staff_permissions.view_own', 'profile', 'staff_permissions.view_own', '{"ar":"عرض staff permissions الخاص","en":"View own staff permissions"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('b1452ce6-0ba9-462f-a22a-361eca93ebff', 'profile.staff_permissions.view_other', 'profile', 'staff_permissions.view_other', '{"ar":"عرض staff permissions للآخرين","en":"View other users staff permissions"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('305a2ad3-4e57-41c1-a484-ac097126d60d', 'profile.staff_permissions.edit_own', 'profile', 'staff_permissions.edit_own', '{"ar":"تعديل staff permissions الخاص","en":"Edit own staff permissions"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('52a3a65d-2128-4222-b67f-6cffe202755e', 'profile.staff_permissions.edit_other', 'profile', 'staff_permissions.edit_other', '{"ar":"تعديل staff permissions للآخرين","en":"Edit other users staff permissions"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('5b1328b1-222e-45e2-af93-42d66abf67c9', 'profile.payment_methods.view_own', 'profile', 'payment_methods.view_own', '{"ar":"عرض payment methods الخاص","en":"View own payment methods"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('eb4c6a9e-d32a-4a0f-bc43-5d2479d26fa1', 'profile.payment_methods.view_other', 'profile', 'payment_methods.view_other', '{"ar":"عرض payment methods للآخرين","en":"View other users payment methods"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('caa8ffa9-6f63-46ca-bcfd-dcf2a4fa878b', 'profile.payment_methods.edit_own', 'profile', 'payment_methods.edit_own', '{"ar":"تعديل payment methods الخاص","en":"Edit own payment methods"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f47692f3-7cd7-4157-8585-291ec66f4cad', 'profile.payment_methods.edit_other', 'profile', 'payment_methods.edit_other', '{"ar":"تعديل payment methods للآخرين","en":"Edit other users payment methods"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('42be7c9f-ae09-4468-a253-f835c03f6369', 'profile.meeting_configs.view_own', 'profile', 'meeting_configs.view_own', '{"ar":"عرض meeting configs الخاص","en":"View own meeting configs"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f9eb24e7-c3bb-4986-a338-bdaed2fe807a', 'profile.meeting_configs.view_other', 'profile', 'meeting_configs.view_other', '{"ar":"عرض meeting configs للآخرين","en":"View other users meeting configs"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1efbfcf6-c6c2-4619-9f5a-3b4cdc60a5ab', 'profile.meeting_configs.edit_own', 'profile', 'meeting_configs.edit_own', '{"ar":"تعديل meeting configs الخاص","en":"Edit own meeting configs"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('49469989-44c2-4348-ae6a-e864f2ad5dd4', 'profile.meeting_configs.edit_other', 'profile', 'meeting_configs.edit_other', '{"ar":"تعديل meeting configs للآخرين","en":"Edit other users meeting configs"}', '{"ar":"حقول الملف الشخصي","en":"Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('151996c1-1f2b-4495-a1fe-5c444551d691', 'student.student_identity.view_own', 'student', 'student_identity.view_own', '{"ar":"عرض student identity للطالب المرتبط","en":"View own student student identity"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('23c6df6d-ab40-4919-bab3-5bab30c9df9a', 'student.student_identity.view_other', 'student', 'student_identity.view_other', '{"ar":"عرض student identity لأي طالب","en":"View any student student identity"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('5f9354db-329f-47d8-9b52-33fbfba3a85b', 'student.student_identity.edit_own', 'student', 'student_identity.edit_own', '{"ar":"تعديل student identity للطالب المرتبط","en":"Edit own student student identity"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('71f099e7-02ac-4894-89f8-d9f9652fc2a9', 'student.student_identity.edit_other', 'student', 'student_identity.edit_other', '{"ar":"تعديل student identity لأي طالب","en":"Edit any student student identity"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('96eff36a-322c-461c-a861-ac3ca8661d0a', 'student.student_academic.view_own', 'student', 'student_academic.view_own', '{"ar":"عرض student academic للطالب المرتبط","en":"View own student student academic"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('59102649-e78a-4253-a50b-d70c843fca7b', 'student.student_academic.view_other', 'student', 'student_academic.view_other', '{"ar":"عرض student academic لأي طالب","en":"View any student student academic"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('be38ffc3-fda0-4f64-9c8b-96ca51ae1fcc', 'student.student_academic.edit_own', 'student', 'student_academic.edit_own', '{"ar":"تعديل student academic للطالب المرتبط","en":"Edit own student student academic"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('943cdb14-bdfa-4ca5-9792-70e47140558d', 'student.student_academic.edit_other', 'student', 'student_academic.edit_other', '{"ar":"تعديل student academic لأي طالب","en":"Edit any student student academic"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('0ee58858-b2ca-4e63-a869-4af0b3ec67b7', 'student.student_teacher.view_own', 'student', 'student_teacher.view_own', '{"ar":"عرض student teacher للطالب المرتبط","en":"View own student student teacher"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('cd528195-dfc5-42ce-8d54-a3b3bc61ef89', 'student.student_teacher.view_other', 'student', 'student_teacher.view_other', '{"ar":"عرض student teacher لأي طالب","en":"View any student student teacher"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2541f4a1-f322-43f0-b2a7-6a6afe4040d5', 'student.student_teacher.edit_own', 'student', 'student_teacher.edit_own', '{"ar":"تعديل student teacher للطالب المرتبط","en":"Edit own student student teacher"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('45a43218-ff27-4831-bb14-d64a1ee27b1e', 'student.student_teacher.edit_other', 'student', 'student_teacher.edit_other', '{"ar":"تعديل student teacher لأي طالب","en":"Edit any student student teacher"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('98d1c1b4-af69-4488-aafb-bb2287268485', 'student.student_parent.view_own', 'student', 'student_parent.view_own', '{"ar":"عرض student parent للطالب المرتبط","en":"View own student student parent"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3bdaa53a-7601-49e3-b235-5791ec59ea7d', 'student.student_parent.view_other', 'student', 'student_parent.view_other', '{"ar":"عرض student parent لأي طالب","en":"View any student student parent"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('102c4557-aa98-4ebb-8907-fb17d2b5eb39', 'student.student_parent.edit_own', 'student', 'student_parent.edit_own', '{"ar":"تعديل student parent للطالب المرتبط","en":"Edit own student student parent"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ed535e55-c485-4135-9b03-75bb8b274bb2', 'student.student_parent.edit_other', 'student', 'student_parent.edit_other', '{"ar":"تعديل student parent لأي طالب","en":"Edit any student student parent"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('fa60581e-3707-4752-8880-b8ed63182835', 'student.student_schedule.view_own', 'student', 'student_schedule.view_own', '{"ar":"عرض student schedule للطالب المرتبط","en":"View own student student schedule"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('72b597d0-fcb9-4693-a104-ee2a964c2407', 'student.student_schedule.view_other', 'student', 'student_schedule.view_other', '{"ar":"عرض student schedule لأي طالب","en":"View any student student schedule"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('30f3a179-01b4-4e4e-b705-548408d43f4f', 'student.student_schedule.edit_own', 'student', 'student_schedule.edit_own', '{"ar":"تعديل student schedule للطالب المرتبط","en":"Edit own student student schedule"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('52a4361a-352f-4e13-a1d0-8750de2947ce', 'student.student_schedule.edit_other', 'student', 'student_schedule.edit_other', '{"ar":"تعديل student schedule لأي طالب","en":"Edit any student student schedule"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c6128fc2-958a-422f-a53d-e52c5effed12', 'student.student_history.view_own', 'student', 'student_history.view_own', '{"ar":"عرض student history للطالب المرتبط","en":"View own student student history"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('70feef4c-8adb-4922-b865-8c32911639d2', 'student.student_history.view_other', 'student', 'student_history.view_other', '{"ar":"عرض student history لأي طالب","en":"View any student student history"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4f8d1cad-8471-49b7-b351-14d790d58dea', 'student.student_history.edit_own', 'student', 'student_history.edit_own', '{"ar":"تعديل student history للطالب المرتبط","en":"Edit own student student history"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('4a55cc6e-ee67-46d2-8c7d-78bb7316abea', 'student.student_history.edit_other', 'student', 'student_history.edit_other', '{"ar":"تعديل student history لأي طالب","en":"Edit any student student history"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('050f1834-52e3-4ca9-b5a5-6c71484a6b06', 'student.student_quota_edit.view_own', 'student', 'student_quota_edit.view_own', '{"ar":"عرض student quota edit للطالب المرتبط","en":"View own student student quota edit"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('983ede97-3b6d-4a09-bf53-1912d55bc167', 'student.student_quota_edit.view_other', 'student', 'student_quota_edit.view_other', '{"ar":"عرض student quota edit لأي طالب","en":"View any student student quota edit"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2cd97f72-c33b-4171-8c0f-07f41117ff72', 'student.student_quota_edit.edit_own', 'student', 'student_quota_edit.edit_own', '{"ar":"تعديل student quota edit للطالب المرتبط","en":"Edit own student student quota edit"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8f85c3bc-d5f3-46c3-a691-a40b90b9c997', 'student.student_quota_edit.edit_other', 'student', 'student_quota_edit.edit_other', '{"ar":"تعديل student quota edit لأي طالب","en":"Edit any student student quota edit"}', '{"ar":"حقول ملف الطالب","en":"Student Profile Fields"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d35adff7-58ed-4ca8-9dda-483695868e79', 'lesson_reports.submit', 'lesson_reports', 'submit', '{"ar":"إرسال تقرير حصة لحصة مكتملة","en":"Submit a lesson report for a completed class instance"}', '{"ar":"تقارير الحصص","en":"Lesson Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8d88270b-576e-4ebe-91d0-b6b9f7e1ad9a', 'lesson_reports.review', 'lesson_reports', 'review', '{"ar":"مراجعة تقارير الحصص المعلقة","en":"Review pending lesson reports"}', '{"ar":"تقارير الحصص","en":"Lesson Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('13a53cbb-1e69-405f-95cf-7ee6b76bb8f0', 'lesson_reports.approve', 'lesson_reports', 'approve', '{"ar":"الموافقة على تقرير حصة معلق","en":"Approve a pending lesson report"}', '{"ar":"تقارير الحصص","en":"Lesson Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d3bbc5c2-df69-4b5b-ae7b-d13e73f14551', 'lesson_reports.reject', 'lesson_reports', 'reject', '{"ar":"رفض تقرير حصة معلق مع ذكر السبب","en":"Reject a pending lesson report with a reason"}', '{"ar":"تقارير الحصص","en":"Lesson Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('adf7d08c-4772-45d8-97fb-e87facd94747', 'supervisor.view_dashboard', 'supervisor', 'view_dashboard', '{"ar":"الوصول إلى لوحة المشرف","en":"Access the supervisor dashboard"}', '{"ar":"المشرف","en":"Supervisor"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('5c7ec0ae-95a3-4530-888d-5f8ea5cbf443', 'student.view_own_dashboard', 'student', 'view_own_dashboard', '{"ar":"عرض لوحة الطالب الخاصة","en":"View the students own dashboard"}', '{"ar":"الطالب","en":"Student"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('81a5236a-693e-4cb1-a3ee-3006b97bd83e', 'credits.manage', 'credits', 'manage', '{"ar":"إدارة رصيد ساعات الطالب (مشتريات / تعديلات)","en":"Manage student credit ledger entries (purchases / adjustments)"}', '{"ar":"الرصيد","en":"Credits"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('3476183a-83de-46ff-a981-3af2e14018cf', 'teacher_dues.view', 'teacher_dues', 'view', '{"ar":"عرض مستحقات المعلم والتقارير الشهرية","en":"View teacher dues ledger and monthly reports"}', '{"ar":"مستحقات المعلمين","en":"Teacher Dues"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('2a62bb6c-f87c-479b-8f42-8324dcd545b5', 'teacher_dues.mark_paid', 'teacher_dues', 'mark_paid', '{"ar":"تعليم مستحقات المعلمين كمدفوعة (مفردة أو دفعة)","en":"Mark teacher dues entries as paid (single or bulk)"}', '{"ar":"مستحقات المعلمين","en":"Teacher Dues"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6da4394f-d265-4315-8105-eb07ec21c127', 'monthly_reports.view', 'monthly_reports', 'view', '{"ar":"عرض التقارير التشغيلية والمالية الشهرية","en":"View monthly operational and financial reports"}', '{"ar":"التقارير","en":"Reports"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('abc6cad3-48c2-4299-bc31-4a83682348d8', 'settings.view', 'settings', 'view', '{"ar":"عرض صفحة الإعدادات","en":"View the settings page"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('246ffab7-8410-4c24-8522-ef575c3e4bb5', 'settings.edit_general', 'settings', 'edit_general', '{"ar":"تعديل إعدادات النظام العامة","en":"Edit general system settings"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ad75ca2d-8af9-4f05-8aa3-08e2a23c1a74', 'settings.edit_env', 'settings', 'edit_env', '{"ar":"تعديل تجاوزات متغيرات البيئة","en":"Edit environment variable overrides"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('1610ece1-97df-409e-9d5c-199af90c8cda', 'settings.edit_session', 'settings', 'edit_session', '{"ar":"تعديل إعدادات الجلسة لكل دور","en":"Edit per-role session configuration"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('c50f5355-910d-4cd1-899e-89ec047f1d26', 'settings.audit_view', 'settings', 'audit_view', '{"ar":"عرض سجلات المراجعة","en":"View audit logs"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('22a44230-9104-4973-8544-a10525d1cee9', 'settings.site_content_manage', 'settings', 'site_content_manage', '{"ar":"إدارة محتوى الموقع","en":"Manage site content"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('9ab42954-8e35-4717-b4c6-fc62e060672d', 'settings.appearance_manage', 'settings', 'appearance_manage', '{"ar":"إدارة مظهر الموقع والهوية البصرية","en":"Manage site appearance and branding"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('6e076a85-9629-47e1-90ad-a5c25caf8313', 'settings.timezones_view', 'settings', 'timezones_view', '{"ar":"عرض كتالوج المناطق الزمنية","en":"View timezone catalog"}', '{"ar":"الإعدادات","en":"Settings"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('11fffd0a-b444-4500-baf7-7b8dd0857f1f', 'whatsapp.view', 'whatsapp', 'view', '{"ar":"عرض إعدادات واتساب","en":"View WhatsApp settings"}', '{"ar":"واتساب","en":"WhatsApp"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('94dc12cc-d83c-4ad7-a4a3-9103cc0c06f1', 'whatsapp.config_manage', 'whatsapp', 'config_manage', '{"ar":"إدارة تكوين حسابات واتساب","en":"Manage WhatsApp account configuration"}', '{"ar":"واتساب","en":"WhatsApp"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('d28d2d2f-3492-4f1c-b900-dc97ebe2b70d', 'whatsapp.templates_manage', 'whatsapp', 'templates_manage', '{"ar":"إدارة قوالب واتساب","en":"Manage WhatsApp templates"}', '{"ar":"واتساب","en":"WhatsApp"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('ca96edb5-2d68-49f8-94e6-abbbcc60ec8b', 'quotas.view', 'quotas', 'view', '{"ar":"عرض خطص ومحفظات الحصص","en":"View quotas and balance breakdown"}', '{"ar":"الفواتير والحصص","en":"Billing & Quotas"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('e128ff2d-81fe-4f51-a4a0-414126fa1e64', 'quotas.manage', 'quotas', 'manage', '{"ar":"إنشاء وتحديث وإلغاء الحصص","en":"Create, update, and delete quotas"}', '{"ar":"الفواتير والحصص","en":"Billing & Quotas"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('8d13313b-5daf-4ce3-9afe-b3ca6fe15a36', 'cron.manage', 'cron', 'manage', '{"ar":"إدارة مهام الكرون","en":"Manage cron jobs"}', '{"ar":"الإدارة","en":"Administration"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, resource, action, description, category, is_system) VALUES ('f08468d1-c272-445b-8abd-7834a4aea70b', 'user.admin_reset_password', 'user', 'admin_reset_password', '{"ar":"إعادة تعيين كلمة مرور المستخدم من قبل المشرف","en":"Admin reset user password"}', '{"ar":"إدارة المستخدمين","en":"User Management"}', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '{"ar":"مدير الأكاديمية","en":"Manager"}', '{"ar":"وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات","en":"Full system access for managing teachers, students, schedules, and billing — except permission control"}', 1, 'academy_admin', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '{"ar":"ولي أمر","en":"Parent"}', '{"ar":"الصلاحيات الافتراضية لحسابات أولياء الأمور","en":"Default permissions for parent accounts"}', 1, 'parent_default', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '{"ar":"موظف","en":"Staff"}', '{"ar":"الصلاحيات الافتراضية لحسابات الموظفين","en":"Default permissions for staff accounts"}', 1, 'staff_default', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '{"ar":"طالب","en":"Student"}', '{"ar":"صلاحيات افتراضية لحسابات الطلاب (سير العمل LMS)","en":"Default permissions for student accounts (LMS workflow)"}', 1, 'student_default', NULL, '2026-08-10T22:49:31.528Z', '2026-08-17T18:52:18.659Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '{"ar":"المشرف الأعلى","en":"Super Admin"}', '{"ar":"وصول كامل للنظام","en":"Full system access"}', 1, 'super_admin', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '{"ar":"مشرف","en":"Supervisor"}', '{"ar":"صلاحيات افتراضية لحسابات المشرفين (سير العمل LMS)","en":"Default permissions for supervisor accounts (LMS workflow)"}', 1, 'supervisor_default', NULL, '2026-08-10T22:49:31.528Z', '2026-08-17T18:52:18.659Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', '{"ar":"نظام آلي","en":"System Automated"}', '{"ar":"قواعد النظام الداخلية للتحقق","en":"Internal system rules for validation"}', 1, 'system_automated', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO permission_groups (id, name, description, is_system, slug, created_by_user_id, created_at, updated_at) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '{"ar":"معلم","en":"Teacher"}', '{"ar":"الصلاحيات الافتراضية لحسابات المعلمين","en":"Default permissions for teacher accounts"}', 1, 'teacher_default', NULL, '2026-08-10T22:49:31.283Z', '2026-08-17T18:52:18.538Z');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9ab42954-8e35-4717-b4c6-fc62e060672d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '9ab42954-8e35-4717-b4c6-fc62e060672d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c8d8e139-0e3f-4f31-98ed-01130c45d72f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd53efdae-120f-493e-b1b5-f085de017b83');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ab263570-35a3-486e-8f94-6d11fa50e53a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'f5cbd860-d5fe-4361-9d06-63bb3b681734');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'c8d8e139-0e3f-4f31-98ed-01130c45d72f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'd53efdae-120f-493e-b1b5-f085de017b83');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '2761c803-8555-45d0-99aa-78567b769ca2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2d3e020b-287d-4239-8c3d-585316271680');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'dbc6b0f0-b6fa-4398-94cf-1e01d42d1779');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7f20b0de-5d45-4edb-b77d-b49c4eb7830f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '5afa6ed4-94d8-4f3e-bb9c-faf71e40303b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'b50f4f53-e4c2-4d77-88ed-180a2c0ac230');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '500f01a3-ec81-4cb0-8b5c-d06defd2a691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f7dbe260-7313-4e02-8786-88cfb8af347c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8c159566-617e-4ed1-a3ef-49ab973c4b13');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '67192dfa-1af7-4b29-80c5-becbcac51199');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'bb6058a1-d32f-4a67-9273-cb46edacfb95');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f4ff99f1-23c1-421a-bcf2-a2fac33fd5fe');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c8305fb5-9bbd-43d0-8839-ef4e090993ef');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'bc36d8da-a025-4b21-a835-ad9cd7c57b31');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4b726a84-e8b7-491f-9321-23100490b426');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2d3e020b-287d-4239-8c3d-585316271680');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'dbc6b0f0-b6fa-4398-94cf-1e01d42d1779');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '7f20b0de-5d45-4edb-b77d-b49c4eb7830f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '5afa6ed4-94d8-4f3e-bb9c-faf71e40303b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'b50f4f53-e4c2-4d77-88ed-180a2c0ac230');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '500f01a3-ec81-4cb0-8b5c-d06defd2a691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f7dbe260-7313-4e02-8786-88cfb8af347c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8c159566-617e-4ed1-a3ef-49ab973c4b13');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '67192dfa-1af7-4b29-80c5-becbcac51199');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'bb6058a1-d32f-4a67-9273-cb46edacfb95');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f4ff99f1-23c1-421a-bcf2-a2fac33fd5fe');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'c8305fb5-9bbd-43d0-8839-ef4e090993ef');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'bc36d8da-a025-4b21-a835-ad9cd7c57b31');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '4b726a84-e8b7-491f-9321-23100490b426');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8812f9f6-0c04-45e2-8d9f-1024c89f020e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f1ee1ea6-4132-4a32-967e-58051095878b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '91cf988f-5116-4893-b59b-4b3dbcc43e5d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8812f9f6-0c04-45e2-8d9f-1024c89f020e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f1ee1ea6-4132-4a32-967e-58051095878b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '91cf988f-5116-4893-b59b-4b3dbcc43e5d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2c3a3c35-f448-4418-93fb-5ad5ab68a015');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2c3a3c35-f448-4418-93fb-5ad5ab68a015');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd35adff7-58ed-4ca8-9dda-483695868e79');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8d88270b-576e-4ebe-91d0-b6b9f7e1ad9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '13a53cbb-1e69-405f-95cf-7ee6b76bb8f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd3bbc5c2-df69-4b5b-ae7b-d13e73f14551');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'adf7d08c-4772-45d8-97fb-e87facd94747');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '5c7ec0ae-95a3-4530-888d-5f8ea5cbf443');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '81a5236a-693e-4cb1-a3ee-3006b97bd83e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3476183a-83de-46ff-a981-3af2e14018cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2a62bb6c-f87c-479b-8f42-8324dcd545b5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6da4394f-d265-4315-8105-eb07ec21c127');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'd35adff7-58ed-4ca8-9dda-483695868e79');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8d88270b-576e-4ebe-91d0-b6b9f7e1ad9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '13a53cbb-1e69-405f-95cf-7ee6b76bb8f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'd3bbc5c2-df69-4b5b-ae7b-d13e73f14551');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'adf7d08c-4772-45d8-97fb-e87facd94747');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '5c7ec0ae-95a3-4530-888d-5f8ea5cbf443');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '81a5236a-693e-4cb1-a3ee-3006b97bd83e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3476183a-83de-46ff-a981-3af2e14018cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2a62bb6c-f87c-479b-8f42-8324dcd545b5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '6da4394f-d265-4315-8105-eb07ec21c127');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '3f1a36d7-1746-4ebd-8d10-06049c183db4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '0555951b-bd15-4f95-b0e6-025e6c5113f9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'd838dc05-9231-4808-855c-ea53bd4a32ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '27cf1f31-ec59-4a7e-ae92-b94722be2b5a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '8d88270b-576e-4ebe-91d0-b6b9f7e1ad9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '13a53cbb-1e69-405f-95cf-7ee6b76bb8f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'd3bbc5c2-df69-4b5b-ae7b-d13e73f14551');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'adf7d08c-4772-45d8-97fb-e87facd94747');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '3476183a-83de-46ff-a981-3af2e14018cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '2a62bb6c-f87c-479b-8f42-8324dcd545b5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '6da4394f-d265-4315-8105-eb07ec21c127');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'd35adff7-58ed-4ca8-9dda-483695868e79');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'c95feb66-fd28-49a4-9600-282bf2615b81');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '9b9fd32b-bd1e-445d-8bc3-be4c8f3781db');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'cac4c741-75ea-462e-a918-33bf5de8068a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '3569eacb-c54e-4021-a673-c388a6a296f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'a4ce93a6-97cb-4f41-96db-7770bc72a7e5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '4ac71221-473d-41ae-bb47-0437f9d1ee8c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '5c7ec0ae-95a3-4530-888d-5f8ea5cbf443');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'f2c4def1-5188-4d6e-95df-bab1fa9b67be');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6c03b680-2c93-4799-a335-9cb8d489230f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fb7da1b7-c4aa-4f9d-b5c2-7609457a296a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ab263570-35a3-486e-8f94-6d11fa50e53a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '432d22c8-31b8-4132-956d-a7e64d26565f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '45b1a10a-079d-498e-b59c-da1455a3f627');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0555951b-bd15-4f95-b0e6-025e6c5113f9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7eb6d5d4-ec3d-4003-abfa-acf6690d4637');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '662dc494-48c2-4499-bb52-c55ab61a2125');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9c205f8f-eb1c-4622-9158-0ddc3c79c9a6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd838dc05-9231-4808-855c-ea53bd4a32ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f5cbd860-d5fe-4361-9d06-63bb3b681734');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'da19aa6e-2e2f-4b03-9ac5-8d1d32395d1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3f1a36d7-1746-4ebd-8d10-06049c183db4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '27cf1f31-ec59-4a7e-ae92-b94722be2b5a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '99c4f50f-5efd-4bec-a1b1-880cb858167d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '54197d51-6c77-4f07-82ed-0381804e939c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'aeebfc2f-26f9-41a7-bbf6-5a4f2e9359d8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c95feb66-fd28-49a4-9600-282bf2615b81');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a03b5dcd-191f-492b-81db-f061d4a173a6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '319036c4-0da2-4afd-9b02-bd479658f58d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '85344324-04eb-4dab-afed-d1f15ae129e0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9b9fd32b-bd1e-445d-8bc3-be4c8f3781db');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'df487509-f946-4132-847f-6d37c955d097');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4975780a-4647-4944-af2b-4cbe904898e8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6956cefe-9837-4286-a12d-be2167d26e43');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'cac4c741-75ea-462e-a918-33bf5de8068a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9f86a8bc-20dd-4d47-80c4-739896eadbc1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '194862ab-050b-4552-a66e-4338b1a44b99');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3dbbe42f-5513-454c-b689-7adbfc37dac7');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3569eacb-c54e-4021-a673-c388a6a296f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'bc16d47a-e835-4dd8-b46a-d6f0d425cbca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0de58aac-17c0-46c5-b4cf-c5e3b2dc8d80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8d96e872-f2c5-4681-bae6-e855b444cb9c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a4ce93a6-97cb-4f41-96db-7770bc72a7e5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '35e80138-5ed7-42ee-9ebd-3207d854dbee');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'aa66c44d-e333-4758-8b31-a5e7d50597d9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '916eeb3e-dd0d-43de-acd9-cd4ff51fe591');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4ac71221-473d-41ae-bb47-0437f9d1ee8c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'cc21437a-a727-41b5-b5b9-4a67b99978df');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4220598e-f15e-4ba7-9656-f0f348f4feb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '11d3abf1-74cc-4af0-8bf1-41c333e7ff54');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f2c4def1-5188-4d6e-95df-bab1fa9b67be');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'e6aca145-3ff4-48ea-97e3-8172fefe2a63');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'b1452ce6-0ba9-462f-a22a-361eca93ebff');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '305a2ad3-4e57-41c1-a484-ac097126d60d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '52a3a65d-2128-4222-b67f-6cffe202755e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '5b1328b1-222e-45e2-af93-42d66abf67c9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'eb4c6a9e-d32a-4a0f-bc43-5d2479d26fa1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'caa8ffa9-6f63-46ca-bcfd-dcf2a4fa878b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f47692f3-7cd7-4157-8585-291ec66f4cad');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '42be7c9f-ae09-4468-a253-f835c03f6369');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f9eb24e7-c3bb-4986-a338-bdaed2fe807a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1efbfcf6-c6c2-4619-9f5a-3b4cdc60a5ab');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '49469989-44c2-4348-ae6a-e864f2ad5dd4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '151996c1-1f2b-4495-a1fe-5c444551d691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '23c6df6d-ab40-4919-bab3-5bab30c9df9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '5f9354db-329f-47d8-9b52-33fbfba3a85b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '71f099e7-02ac-4894-89f8-d9f9652fc2a9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '96eff36a-322c-461c-a861-ac3ca8661d0a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '59102649-e78a-4253-a50b-d70c843fca7b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'be38ffc3-fda0-4f64-9c8b-96ca51ae1fcc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '943cdb14-bdfa-4ca5-9792-70e47140558d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0ee58858-b2ca-4e63-a869-4af0b3ec67b7');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'cd528195-dfc5-42ce-8d54-a3b3bc61ef89');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2541f4a1-f322-43f0-b2a7-6a6afe4040d5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '45a43218-ff27-4831-bb14-d64a1ee27b1e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '98d1c1b4-af69-4488-aafb-bb2287268485');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3bdaa53a-7601-49e3-b235-5791ec59ea7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '102c4557-aa98-4ebb-8907-fb17d2b5eb39');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ed535e55-c485-4135-9b03-75bb8b274bb2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fa60581e-3707-4752-8880-b8ed63182835');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '72b597d0-fcb9-4693-a104-ee2a964c2407');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '30f3a179-01b4-4e4e-b705-548408d43f4f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '52a4361a-352f-4e13-a1d0-8750de2947ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c6128fc2-958a-422f-a53d-e52c5effed12');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '70feef4c-8adb-4922-b865-8c32911639d2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4f8d1cad-8471-49b7-b351-14d790d58dea');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4a55cc6e-ee67-46d2-8c7d-78bb7316abea');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '050f1834-52e3-4ca9-b5a5-6c71484a6b06');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '983ede97-3b6d-4a09-bf53-1912d55bc167');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2cd97f72-c33b-4171-8c0f-07f41117ff72');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8f85c3bc-d5f3-46c3-a691-a40b90b9c997');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '52a3a65d-2128-4222-b67f-6cffe202755e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ab263570-35a3-486e-8f94-6d11fa50e53a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '0555951b-bd15-4f95-b0e6-025e6c5113f9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '662dc494-48c2-4499-bb52-c55ab61a2125');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'd838dc05-9231-4808-855c-ea53bd4a32ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'da19aa6e-2e2f-4b03-9ac5-8d1d32395d1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '27cf1f31-ec59-4a7e-ae92-b94722be2b5a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '54197d51-6c77-4f07-82ed-0381804e939c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'c95feb66-fd28-49a4-9600-282bf2615b81');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '319036c4-0da2-4afd-9b02-bd479658f58d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '9b9fd32b-bd1e-445d-8bc3-be4c8f3781db');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '4975780a-4647-4944-af2b-4cbe904898e8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'cac4c741-75ea-462e-a918-33bf5de8068a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '194862ab-050b-4552-a66e-4338b1a44b99');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3569eacb-c54e-4021-a673-c388a6a296f0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '0de58aac-17c0-46c5-b4cf-c5e3b2dc8d80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'a4ce93a6-97cb-4f41-96db-7770bc72a7e5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'aa66c44d-e333-4758-8b31-a5e7d50597d9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '4ac71221-473d-41ae-bb47-0437f9d1ee8c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '4220598e-f15e-4ba7-9656-f0f348f4feb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f2c4def1-5188-4d6e-95df-bab1fa9b67be');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'b1452ce6-0ba9-462f-a22a-361eca93ebff');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '52a3a65d-2128-4222-b67f-6cffe202755e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'eb4c6a9e-d32a-4a0f-bc43-5d2479d26fa1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f47692f3-7cd7-4157-8585-291ec66f4cad');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f9eb24e7-c3bb-4986-a338-bdaed2fe807a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '49469989-44c2-4348-ae6a-e864f2ad5dd4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '23c6df6d-ab40-4919-bab3-5bab30c9df9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '71f099e7-02ac-4894-89f8-d9f9652fc2a9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '59102649-e78a-4253-a50b-d70c843fca7b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '943cdb14-bdfa-4ca5-9792-70e47140558d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'cd528195-dfc5-42ce-8d54-a3b3bc61ef89');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '45a43218-ff27-4831-bb14-d64a1ee27b1e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3bdaa53a-7601-49e3-b235-5791ec59ea7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ed535e55-c485-4135-9b03-75bb8b274bb2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '72b597d0-fcb9-4693-a104-ee2a964c2407');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '52a4361a-352f-4e13-a1d0-8750de2947ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '70feef4c-8adb-4922-b865-8c32911639d2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '4a55cc6e-ee67-46d2-8c7d-78bb7316abea');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '983ede97-3b6d-4a09-bf53-1912d55bc167');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8f85c3bc-d5f3-46c3-a691-a40b90b9c997');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'f47692f3-7cd7-4157-8585-291ec66f4cad');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '6c03b680-2c93-4799-a335-9cb8d489230f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'fb7da1b7-c4aa-4f9d-b5c2-7609457a296a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '432d22c8-31b8-4132-956d-a7e64d26565f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '45b1a10a-079d-498e-b59c-da1455a3f627');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '7eb6d5d4-ec3d-4003-abfa-acf6690d4637');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '662dc494-48c2-4499-bb52-c55ab61a2125');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '9c205f8f-eb1c-4622-9158-0ddc3c79c9a6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'da19aa6e-2e2f-4b03-9ac5-8d1d32395d1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '35e80138-5ed7-42ee-9ebd-3207d854dbee');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'aa66c44d-e333-4758-8b31-a5e7d50597d9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '5b1328b1-222e-45e2-af93-42d66abf67c9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'caa8ffa9-6f63-46ca-bcfd-dcf2a4fa878b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '42be7c9f-ae09-4468-a253-f835c03f6369');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '1efbfcf6-c6c2-4619-9f5a-3b4cdc60a5ab');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '151996c1-1f2b-4495-a1fe-5c444551d691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '96eff36a-322c-461c-a861-ac3ca8661d0a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '0ee58858-b2ca-4e63-a869-4af0b3ec67b7');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'fa60581e-3707-4752-8880-b8ed63182835');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'c6128fc2-958a-422f-a53d-e52c5effed12');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '6c03b680-2c93-4799-a335-9cb8d489230f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'fb7da1b7-c4aa-4f9d-b5c2-7609457a296a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '432d22c8-31b8-4132-956d-a7e64d26565f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '45b1a10a-079d-498e-b59c-da1455a3f627');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '99c4f50f-5efd-4bec-a1b1-880cb858167d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '54197d51-6c77-4f07-82ed-0381804e939c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'aeebfc2f-26f9-41a7-bbf6-5a4f2e9359d8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '319036c4-0da2-4afd-9b02-bd479658f58d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '4975780a-4647-4944-af2b-4cbe904898e8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '194862ab-050b-4552-a66e-4338b1a44b99');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'bc16d47a-e835-4dd8-b46a-d6f0d425cbca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '0de58aac-17c0-46c5-b4cf-c5e3b2dc8d80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '5b1328b1-222e-45e2-af93-42d66abf67c9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'eb4c6a9e-d32a-4a0f-bc43-5d2479d26fa1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'caa8ffa9-6f63-46ca-bcfd-dcf2a4fa878b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '42be7c9f-ae09-4468-a253-f835c03f6369');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'f9eb24e7-c3bb-4986-a338-bdaed2fe807a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '1efbfcf6-c6c2-4619-9f5a-3b4cdc60a5ab');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '151996c1-1f2b-4495-a1fe-5c444551d691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '96eff36a-322c-461c-a861-ac3ca8661d0a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '0ee58858-b2ca-4e63-a869-4af0b3ec67b7');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'fa60581e-3707-4752-8880-b8ed63182835');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'c6128fc2-958a-422f-a53d-e52c5effed12');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '2cd97f72-c33b-4171-8c0f-07f41117ff72');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '6c03b680-2c93-4799-a335-9cb8d489230f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '432d22c8-31b8-4132-956d-a7e64d26565f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'cc21437a-a727-41b5-b5b9-4a67b99978df');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '4220598e-f15e-4ba7-9656-f0f348f4feb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'f2c4def1-5188-4d6e-95df-bab1fa9b67be');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'b1452ce6-0ba9-462f-a22a-361eca93ebff');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '52a3a65d-2128-4222-b67f-6cffe202755e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '151996c1-1f2b-4495-a1fe-5c444551d691');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '96eff36a-322c-461c-a861-ac3ca8661d0a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '0ee58858-b2ca-4e63-a869-4af0b3ec67b7');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', 'fa60581e-3707-4752-8880-b8ed63182835');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', 'c6128fc2-958a-422f-a53d-e52c5effed12');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '95c4de0d-5b7b-40f4-85c2-fe74f5037075');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '6c03b680-2c93-4799-a335-9cb8d489230f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '432d22c8-31b8-4132-956d-a7e64d26565f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '64fb760f-9584-45c8-a703-f21c89283511');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '662dc494-48c2-4499-bb52-c55ab61a2125');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'da19aa6e-2e2f-4b03-9ac5-8d1d32395d1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '54197d51-6c77-4f07-82ed-0381804e939c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '319036c4-0da2-4afd-9b02-bd479658f58d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '4975780a-4647-4944-af2b-4cbe904898e8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '194862ab-050b-4552-a66e-4338b1a44b99');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '0de58aac-17c0-46c5-b4cf-c5e3b2dc8d80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'aa66c44d-e333-4758-8b31-a5e7d50597d9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'cc21437a-a727-41b5-b5b9-4a67b99978df');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '4220598e-f15e-4ba7-9656-f0f348f4feb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'b1452ce6-0ba9-462f-a22a-361eca93ebff');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'eb4c6a9e-d32a-4a0f-bc43-5d2479d26fa1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'f9eb24e7-c3bb-4986-a338-bdaed2fe807a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '23c6df6d-ab40-4919-bab3-5bab30c9df9a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '59102649-e78a-4253-a50b-d70c843fca7b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'cd528195-dfc5-42ce-8d54-a3b3bc61ef89');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '3bdaa53a-7601-49e3-b235-5791ec59ea7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '72b597d0-fcb9-4693-a104-ee2a964c2407');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '70feef4c-8adb-4922-b865-8c32911639d2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '983ede97-3b6d-4a09-bf53-1912d55bc167');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '5f9354db-329f-47d8-9b52-33fbfba3a85b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '102c4557-aa98-4ebb-8907-fb17d2b5eb39');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7b129c3d-3d6d-428c-bded-0192c50d02aa');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '66c15203-362a-44a3-932d-7817cad5a535');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '64ff97a0-91fb-4c13-abd5-37c6c84742ad');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7c4cd027-cd7d-4764-9c35-68830732fe2f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '7b129c3d-3d6d-428c-bded-0192c50d02aa');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '66c15203-362a-44a3-932d-7817cad5a535');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '64ff97a0-91fb-4c13-abd5-37c6c84742ad');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '7c4cd027-cd7d-4764-9c35-68830732fe2f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '66c15203-362a-44a3-932d-7817cad5a535');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '66c15203-362a-44a3-932d-7817cad5a535');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8ba8d60d-79a9-45be-92b6-39502686ac1a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2ef4c721-6901-4a80-a1b0-e7336eda19cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8ba8d60d-79a9-45be-92b6-39502686ac1a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2ef4c721-6901-4a80-a1b0-e7336eda19cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'abc6cad3-48c2-4299-bc31-4a83682348d8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '246ffab7-8410-4c24-8522-ef575c3e4bb5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ad75ca2d-8af9-4f05-8aa3-08e2a23c1a74');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1610ece1-97df-409e-9d5c-199af90c8cda');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c50f5355-910d-4cd1-899e-89ec047f1d26');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '22a44230-9104-4973-8544-a10525d1cee9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6e076a85-9629-47e1-90ad-a5c25caf8313');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '49469989-44c2-4348-ae6a-e864f2ad5dd4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '71f099e7-02ac-4894-89f8-d9f9652fc2a9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '943cdb14-bdfa-4ca5-9792-70e47140558d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '45a43218-ff27-4831-bb14-d64a1ee27b1e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ed535e55-c485-4135-9b03-75bb8b274bb2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '52a4361a-352f-4e13-a1d0-8750de2947ce');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '4a55cc6e-ee67-46d2-8c7d-78bb7316abea');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '8f85c3bc-d5f3-46c3-a691-a40b90b9c997');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '015c314c-ed51-4b58-a555-844993cad70a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6f413ff3-bcd6-4f25-9f15-7eda5f92780b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'b20210a7-44c2-4773-97f1-bf7bfc25651c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c7296f07-55ee-4f5b-9af4-13dc7a01dd1d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3d4b1484-2441-4509-b552-df6ff2a481e1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'dcd0cd08-5faa-481a-9597-54bdaceaf663');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '85fa553e-2adf-4e4b-8b17-74d164fa29cc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '072c78dd-cbf7-4a0d-a7e1-220700df7b00');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9a7935e4-19ac-4a6f-aa03-0650f56b9f71');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a11411bc-f300-4223-8433-961650394caf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'da58c526-641f-4696-ae7f-69238d2aa877');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '497accac-070d-4366-a8eb-3a6a1e095de0');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2accab14-9b8c-41fa-afe7-59d00021e9d6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8ba2cef0-31ac-459a-9a02-7d6c54332a34');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '07cb4c8c-93ef-4d0f-8d9b-2c6d6946282c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a8ee48d3-101c-4742-8e41-a1908ea5c404');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'cfe6d8c2-3a75-4ac1-97e1-e607b61a0a1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7e13b131-31ea-426d-94a3-a7e563a57ebc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'faa4a222-2c5c-4130-bfcd-377dd88bce26');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '793a8029-8126-4044-8c05-38875a5312cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a01036ce-60dd-4316-80dc-81fae301a9e1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f2439674-3623-4248-89fd-828c9df398f3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '434a884e-5825-403b-b5bc-8c28bdccd522');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '48fb6e5f-0763-4e83-b9d1-6f50394fb5e3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ac129933-1ac4-4644-9ad4-269b2cd6337a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fcf0f5f4-4ca3-4ecd-b3a9-5e1bd8441656');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0aca4c1d-6b10-4d74-91c8-8e61612632b1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f77687a1-5230-474d-ad1b-dc23f3af4eac');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f453ea6d-8b01-4626-947d-1e81eb986a45');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c3d9c303-abf8-4849-b66b-87c85844143b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ee045c2b-4018-4ed8-9d8b-a6fb8ab4cdb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '052375be-39ed-4ff8-a8c9-36316ee28267');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '9c419354-5f83-4493-9ecf-b3d18c6a3376');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'a75adf3f-5b0f-4b5a-8d1c-b2f2e6e5b548');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'c1b2c070-c408-4342-b1d3-506479fc07b8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3c2b894f-e323-4465-a911-14e693cf8013');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'aefcc5ff-0748-4730-ad18-f39b71e7b65f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fa3a97b9-5c5c-45ff-9b47-e9389f701b7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0806e2d1-ba5b-437e-ab8f-bb806d637508');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '60b4a39e-3acc-4f52-af7c-4a4a62e7f457');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ac6bfc38-a4b5-4549-81ef-093762eeccf6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'cf8610d3-615d-4d78-b1e9-247fc9b83a3e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '4dbf590b-8df2-4e4f-aaa9-1c2ab595d419');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '96030e1e-3375-462e-b22c-1d9a175ec443');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '00c21be7-1123-45cf-aef1-b22bb106734e');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7a34f427-840c-4558-89a0-4570246278c1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '734a1cf2-9c0a-4780-adf2-3c216a099a57');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '626d9f22-10e0-42a0-963c-c1c00a58b310');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1f1a5703-2682-407c-ab00-0360c6beb14d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'e0dddb5e-2980-4adc-b2de-b2e67b4ab4cd');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6cbdc8b8-ce4f-48f0-bc93-5e2a5c8f96be');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '17d84836-df42-4e7f-b305-93f7d6f6fc64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0382db77-329e-4cfa-90a7-5ff1a42d8318');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'afd0dd76-5e25-4a22-baeb-7ab2722d7b92');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '79ca4933-99ac-4656-8d14-ace47fc99397');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8526786a-7cb0-44a4-88c9-3c17aeb1b934');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '54bca7e7-1cd1-4f9f-8533-dcf403bb9f3b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '085b0359-b76a-4c1b-972c-1c9477d4fcb1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6225570a-cbbd-40ef-8418-a7a005acf51f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '6874a759-c625-4e34-9b9d-d13abe26bef4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '071aab02-3df2-4e7c-9d1b-2a83c31dde33');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3365c08d-2569-4f39-b99e-fd574a8178f8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '0d55fc9d-a1a4-4f9a-b1eb-1729fabaf205');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fb1d41f5-5735-4755-8f8e-467a0b6cef22');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '533129f5-2d88-4fa8-8d80-8ba9db73987f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1c9db6bb-a5d7-44ad-a1d1-35029dbeca61');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '10b2afbf-e7c6-4f85-8d27-d2b057106847');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1a9f13d1-9687-4de2-86b2-3da2d82cfb55');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'eba9dcc2-2cbf-44d9-b7f9-18b1db83444b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'aaeca11b-31e2-48e7-9305-67fe10519cb9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8d27a158-6ff4-4487-abdb-c663089dc1ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ef555a4a-b974-463f-934f-a9800c821efb');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '653dfb63-684e-410e-9577-649b27160002');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '54caf17d-a9f8-4ddb-8863-9807c4b27a22');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '86e4a01b-ae9f-465e-9278-57faacaf29b3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '2c6c8ddc-e45f-4c27-84da-9e32e24ed12b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '25917325-1442-4f1b-b858-9f1b0111ad7b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '15e38efb-f710-4b09-a5c8-d6eaf93c0152');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '1f11448c-7654-475f-838f-aa3c154c6d78');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '303ea0c8-594a-4f40-a6ba-2c50617138ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '7b588f31-3ef6-42e9-a874-ddec713b86cd');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8c7405c4-3d36-4b3c-8d63-51cbb2a1d46c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '3ea8db5f-b79d-43c6-aa00-7cc2a7cbad80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd3499ecb-e6b6-4a72-a4b4-4bde4bc22510');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '71278577-515e-4854-bd80-b05907fdc924');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '11d7e564-3ab8-4980-b259-20e54ee971a2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '239e7836-7919-4307-901c-93cbcd6666a8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '29dd785b-fbf2-4276-88b9-367b7dbc7fc5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '39f6c6f5-b78d-4240-b225-bb6fe2aa7c44');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'fd42c055-08b3-418d-8320-041284eadb2d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '6f413ff3-bcd6-4f25-9f15-7eda5f92780b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'c7296f07-55ee-4f5b-9af4-13dc7a01dd1d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3d4b1484-2441-4509-b552-df6ff2a481e1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'dcd0cd08-5faa-481a-9597-54bdaceaf663');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '85fa553e-2adf-4e4b-8b17-74d164fa29cc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'a11411bc-f300-4223-8433-961650394caf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2accab14-9b8c-41fa-afe7-59d00021e9d6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8ba2cef0-31ac-459a-9a02-7d6c54332a34');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'cfe6d8c2-3a75-4ac1-97e1-e607b61a0a1b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '7e13b131-31ea-426d-94a3-a7e563a57ebc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'faa4a222-2c5c-4130-bfcd-377dd88bce26');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '793a8029-8126-4044-8c05-38875a5312cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'a01036ce-60dd-4316-80dc-81fae301a9e1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'f2439674-3623-4248-89fd-828c9df398f3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '434a884e-5825-403b-b5bc-8c28bdccd522');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '48fb6e5f-0763-4e83-b9d1-6f50394fb5e3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ac129933-1ac4-4644-9ad4-269b2cd6337a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'c3d9c303-abf8-4849-b66b-87c85844143b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ee045c2b-4018-4ed8-9d8b-a6fb8ab4cdb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'a75adf3f-5b0f-4b5a-8d1c-b2f2e6e5b548');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3c2b894f-e323-4465-a911-14e693cf8013');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'aefcc5ff-0748-4730-ad18-f39b71e7b65f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'fa3a97b9-5c5c-45ff-9b47-e9389f701b7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '0806e2d1-ba5b-437e-ab8f-bb806d637508');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '60b4a39e-3acc-4f52-af7c-4a4a62e7f457');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ac6bfc38-a4b5-4549-81ef-093762eeccf6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '626d9f22-10e0-42a0-963c-c1c00a58b310');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '1f1a5703-2682-407c-ab00-0360c6beb14d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'e0dddb5e-2980-4adc-b2de-b2e67b4ab4cd');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '17d84836-df42-4e7f-b305-93f7d6f6fc64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '0382db77-329e-4cfa-90a7-5ff1a42d8318');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'afd0dd76-5e25-4a22-baeb-7ab2722d7b92');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '6874a759-c625-4e34-9b9d-d13abe26bef4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '071aab02-3df2-4e7c-9d1b-2a83c31dde33');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3365c08d-2569-4f39-b99e-fd574a8178f8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '0d55fc9d-a1a4-4f9a-b1eb-1729fabaf205');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '533129f5-2d88-4fa8-8d80-8ba9db73987f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '1c9db6bb-a5d7-44ad-a1d1-35029dbeca61');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '10b2afbf-e7c6-4f85-8d27-d2b057106847');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '1a9f13d1-9687-4de2-86b2-3da2d82cfb55');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'eba9dcc2-2cbf-44d9-b7f9-18b1db83444b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8d27a158-6ff4-4487-abdb-c663089dc1ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ef555a4a-b974-463f-934f-a9800c821efb');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '653dfb63-684e-410e-9577-649b27160002');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '54caf17d-a9f8-4ddb-8863-9807c4b27a22');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '86e4a01b-ae9f-465e-9278-57faacaf29b3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '2c6c8ddc-e45f-4c27-84da-9e32e24ed12b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '25917325-1442-4f1b-b858-9f1b0111ad7b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '15e38efb-f710-4b09-a5c8-d6eaf93c0152');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '1f11448c-7654-475f-838f-aa3c154c6d78');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '303ea0c8-594a-4f40-a6ba-2c50617138ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8c7405c4-3d36-4b3c-8d63-51cbb2a1d46c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '3ea8db5f-b79d-43c6-aa00-7cc2a7cbad80');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '29dd785b-fbf2-4276-88b9-367b7dbc7fc5');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '39f6c6f5-b78d-4240-b225-bb6fe2aa7c44');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'b20210a7-44c2-4773-97f1-bf7bfc25651c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '072c78dd-cbf7-4a0d-a7e1-220700df7b00');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'a8ee48d3-101c-4742-8e41-a1908ea5c404');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '7e13b131-31ea-426d-94a3-a7e563a57ebc');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'faa4a222-2c5c-4130-bfcd-377dd88bce26');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '793a8029-8126-4044-8c05-38875a5312cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', 'fcf0f5f4-4ca3-4ecd-b3a9-5e1bd8441656');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '0aca4c1d-6b10-4d74-91c8-8e61612632b1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '626d9f22-10e0-42a0-963c-c1c00a58b310');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '1c9db6bb-a5d7-44ad-a1d1-35029dbeca61');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('0ba8e60a-8b99-4765-8f1a-a5006b75b57d', '10b2afbf-e7c6-4f85-8d27-d2b057106847');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'b20210a7-44c2-4773-97f1-bf7bfc25651c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '9a7935e4-19ac-4a6f-aa03-0650f56b9f71');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '793a8029-8126-4044-8c05-38875a5312cf');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'aaeca11b-31e2-48e7-9305-67fe10519cb9');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '54caf17d-a9f8-4ddb-8863-9807c4b27a22');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', 'd3499ecb-e6b6-4a72-a4b4-4bde4bc22510');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '71278577-515e-4854-bd80-b05907fdc924');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '11d7e564-3ab8-4980-b259-20e54ee971a2');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('8a51ffab-a417-4d86-9487-50bb5fe4624d', '6874a759-c625-4e34-9b9d-d13abe26bef4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '015c314c-ed51-4b58-a555-844993cad70a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'b20210a7-44c2-4773-97f1-bf7bfc25651c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'c7296f07-55ee-4f5b-9af4-13dc7a01dd1d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '07cb4c8c-93ef-4d0f-8d9b-2c6d6946282c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '9c419354-5f83-4493-9ecf-b3d18c6a3376');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '3c2b894f-e323-4465-a911-14e693cf8013');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'fa3a97b9-5c5c-45ff-9b47-e9389f701b7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '17d84836-df42-4e7f-b305-93f7d6f6fc64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', 'f77687a1-5230-474d-ad1b-dc23f3af4eac');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', 'f453ea6d-8b01-4626-947d-1e81eb986a45');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', '7b588f31-3ef6-42e9-a874-ddec713b86cd');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', 'c744708b-b6a3-4df6-afb3-998a2c2073fb');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', '5108d7bc-de71-4ed3-9c2c-85f770875e00');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', '8cadb2f1-c251-40f7-963a-5cd937154a66');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'fb7da1b7-c4aa-4f9d-b5c2-7609457a296a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', '45b1a10a-079d-498e-b59c-da1455a3f627');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'fb7da1b7-c4aa-4f9d-b5c2-7609457a296a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '45b1a10a-079d-498e-b59c-da1455a3f627');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ca96edb5-2d68-49f8-94e6-abbbcc60ec8b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'ca96edb5-2d68-49f8-94e6-abbbcc60ec8b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'ca96edb5-2d68-49f8-94e6-abbbcc60ec8b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('dc3c6bb1-aa9d-4eb5-ba7d-746ad428ca96', 'ca96edb5-2d68-49f8-94e6-abbbcc60ec8b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'e128ff2d-81fe-4f51-a4a0-414126fa1e64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', 'e128ff2d-81fe-4f51-a4a0-414126fa1e64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '11fffd0a-b444-4500-baf7-7b8dd0857f1f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '94dc12cc-d83c-4ad7-a4a3-9103cc0c06f1');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'd28d2d2f-3492-4f1c-b900-dc97ebe2b70d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', '8d13313b-5daf-4ce3-9afe-b3ca6fe15a36');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('7ad65f85-3dc9-4e82-bb26-931839d5bc2e', '8d13313b-5daf-4ce3-9afe-b3ca6fe15a36');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('41510dc0-6350-4c4e-b226-a1bce026acee', 'f08468d1-c272-445b-8abd-7834a4aea70b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('93a1784a-de35-4d3a-a84d-ff39cb023530', '239e7836-7919-4307-901c-93cbcd6666a8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'b20210a7-44c2-4773-97f1-bf7bfc25651c');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'dcd0cd08-5faa-481a-9597-54bdaceaf663');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '072c78dd-cbf7-4a0d-a7e1-220700df7b00');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '48fb6e5f-0763-4e83-b9d1-6f50394fb5e3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ac129933-1ac4-4644-9ad4-269b2cd6337a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'c3d9c303-abf8-4849-b66b-87c85844143b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'ee045c2b-4018-4ed8-9d8b-a6fb8ab4cdb6');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '052375be-39ed-4ff8-a8c9-36316ee28267');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '9c419354-5f83-4493-9ecf-b3d18c6a3376');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'a75adf3f-5b0f-4b5a-8d1c-b2f2e6e5b548');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'c1b2c070-c408-4342-b1d3-506479fc07b8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '3c2b894f-e323-4465-a911-14e693cf8013');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'aefcc5ff-0748-4730-ad18-f39b71e7b65f');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'fa3a97b9-5c5c-45ff-9b47-e9389f701b7d');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '0806e2d1-ba5b-437e-ab8f-bb806d637508');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '17d84836-df42-4e7f-b305-93f7d6f6fc64');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'afd0dd76-5e25-4a22-baeb-7ab2722d7b92');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '6874a759-c625-4e34-9b9d-d13abe26bef4');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '3365c08d-2569-4f39-b99e-fd574a8178f8');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '0d55fc9d-a1a4-4f9a-b1eb-1729fabaf205');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '1c9db6bb-a5d7-44ad-a1d1-35029dbeca61');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '10b2afbf-e7c6-4f85-8d27-d2b057106847');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '1a9f13d1-9687-4de2-86b2-3da2d82cfb55');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', 'eba9dcc2-2cbf-44d9-b7f9-18b1db83444b');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '8d27a158-6ff4-4487-abdb-c663089dc1ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '1f11448c-7654-475f-838f-aa3c154c6d78');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('ca207431-2215-459c-8477-d9e5bef7a38e', '303ea0c8-594a-4f40-a6ba-2c50617138ca');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '072c78dd-cbf7-4a0d-a7e1-220700df7b00');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', 'ba367eee-ccb6-4645-807b-268c7a954c52');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '48fb6e5f-0763-4e83-b9d1-6f50394fb5e3');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', 'ac129933-1ac4-4644-9ad4-269b2cd6337a');
--> statement-breakpoint
INSERT OR IGNORE INTO group_permissions (group_id, permission_id) VALUES ('d79724e8-aeca-45d0-859f-1ed90fc68132', '6874a759-c625-4e34-9b9d-d13abe26bef4');
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Abidjan', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Accra', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Addis_Ababa', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Algiers', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Asmara', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Bamako', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Bangui', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Banjul', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Bissau', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Blantyre', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Brazzaville', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Bujumbura', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Cairo', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Casablanca', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Ceuta', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Conakry', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Dakar', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Dar_es_Salaam', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Djibouti', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Douala', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/El_Aaiun', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Freetown', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Gaborone', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Harare', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Johannesburg', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Juba', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Kampala', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Khartoum', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Kigali', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Kinshasa', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Lagos', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Libreville', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Lome', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Luanda', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Lubumbashi', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Lusaka', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Malabo', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Maputo', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Maseru', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Mbabane', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Mogadishu', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Monrovia', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Nairobi', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Ndjamena', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Niamey', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Nouakchott', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Ouagadougou', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Porto-Novo', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Sao_Tome', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Tripoli', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Tunis', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Africa/Windhoek', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Adak', -600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Anchorage', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Anguilla', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Antigua', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Araguaina', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Buenos_Aires', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Catamarca', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Cordoba', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Jujuy', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/La_Rioja', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Mendoza', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Rio_Gallegos', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Salta', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/San_Juan', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/San_Luis', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Tucuman', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Argentina/Ushuaia', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Aruba', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Asuncion', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Atikokan', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Bahia', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Bahia_Banderas', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Barbados', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Belem', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Belize', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Blanc-Sablon', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Boa_Vista', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Bogota', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Boise', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Cambridge_Bay', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Campo_Grande', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Cancun', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Caracas', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Cayenne', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Cayman', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Chicago', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Chihuahua', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Ciudad_Juarez', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Costa_Rica', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Creston', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Cuiaba', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Curacao', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Danmarkshavn', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Dawson', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Dawson_Creek', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Denver', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Detroit', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Dominica', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Edmonton', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Eirunepe', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/El_Salvador', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Fortaleza', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Fort_Nelson', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Glace_Bay', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Goose_Bay', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Grand_Turk', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Grenada', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Guadeloupe', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Guatemala', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Guayaquil', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Guyana', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Halifax', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Havana', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Hermosillo', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Indianapolis', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Knox', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Marengo', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Petersburg', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Tell_City', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Vevay', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Vincennes', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Indiana/Winamac', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Inuvik', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Iqaluit', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Jamaica', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Juneau', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Kentucky/Louisville', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Kentucky/Monticello', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Kralendijk', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/La_Paz', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Lima', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Los_Angeles', -480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Lower_Princes', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Maceio', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Managua', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Manaus', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Marigot', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Martinique', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Matamoros', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Mazatlan', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Menominee', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Merida', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Metlakatla', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Mexico_City', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Miquelon', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Moncton', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Monterrey', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Montevideo', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Montserrat', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Nassau', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/New_York', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Nome', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Noronha', -120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/North_Dakota/Beulah', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/North_Dakota/Center', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/North_Dakota/New_Salem', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Nuuk', -120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Ojinaga', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Panama', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Paramaribo', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Phoenix', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Port-au-Prince', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Port_of_Spain', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Porto_Velho', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Puerto_Rico', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Punta_Arenas', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Rankin_Inlet', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Recife', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Regina', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Resolute', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Rio_Branco', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Santarem', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Santiago', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Santo_Domingo', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Sao_Paulo', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Scoresbysund', -120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Sitka', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Barthelemy', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Johns', -210, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Kitts', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Lucia', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Thomas', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/St_Vincent', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Swift_Current', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Tegucigalpa', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Thule', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Tijuana', -480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Toronto', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Tortola', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Vancouver', -480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Whitehorse', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Winnipeg', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('America/Yakutat', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Casey', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Davis', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/DumontDUrville', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Macquarie', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Mawson', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/McMurdo', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Palmer', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Rothera', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Syowa', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Troll', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Antarctica/Vostok', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Arctic/Longyearbyen', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Aden', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Almaty', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Amman', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Anadyr', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Aqtau', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Aqtobe', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Ashgabat', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Atyrau', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Baghdad', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Bahrain', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Baku', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Bangkok', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Barnaul', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Beirut', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Bishkek', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Brunei', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Chita', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Choibalsan', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Colombo', 330, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Damascus', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Dhaka', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Dili', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Dubai', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Dushanbe', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Famagusta', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Gaza', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Hebron', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Ho_Chi_Minh', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Hong_Kong', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Hovd', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Irkutsk', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Jakarta', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Jayapura', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kabul', 270, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kamchatka', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Karachi', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kathmandu', 345, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Khandyga', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kolkata', 330, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Krasnoyarsk', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kuala_Lumpur', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kuching', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Kuwait', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Macau', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Magadan', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Makassar', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Manila', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Muscat', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Nicosia', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Novokuznetsk', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Novosibirsk', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Omsk', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Oral', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Phnom_Penh', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Pontianak', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Pyongyang', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Qatar', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Qostanay', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Qyzylorda', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Riyadh', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Sakhalin', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Samarkand', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Seoul', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Shanghai', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Singapore', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Srednekolymsk', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Taipei', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Tashkent', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Tbilisi', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Tehran', 210, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Thimphu', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Tokyo', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Tomsk', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Ulaanbaatar', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Urumqi', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Ust-Nera', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Vientiane', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Vladivostok', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Yakutsk', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Yangon', 390, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Yekaterinburg', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Asia/Yerevan', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Azores', -60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Bermuda', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Canary', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Cape_Verde', -60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Faroe', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Madeira', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Reykjavik', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/South_Georgia', -120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/Stanley', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Atlantic/St_Helena', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Adelaide', 570, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Brisbane', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Broken_Hill', 570, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Darwin', 570, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Eucla', 525, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Hobart', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Lindeman', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Lord_Howe', 630, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Melbourne', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Perth', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Australia/Sydney', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+1', -60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-1', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+10', -600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-10', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+11', -660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-11', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+12', -720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-12', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-13', 780, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-14', 840, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+2', -120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-2', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+3', -180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-3', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+4', -240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-4', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+5', -300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-5', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+6', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-6', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+7', -420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-7', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+8', -480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-8', 480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT+9', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Etc/GMT-9', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Amsterdam', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Andorra', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Astrakhan', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Athens', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Belgrade', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Berlin', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Bratislava', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Brussels', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Bucharest', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Budapest', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Busingen', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Chisinau', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Copenhagen', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Dublin', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Gibraltar', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Guernsey', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Helsinki', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Isle_of_Man', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Istanbul', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Jersey', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Kaliningrad', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Kirov', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Kyiv', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Lisbon', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Ljubljana', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/London', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Luxembourg', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Madrid', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Malta', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Mariehamn', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Minsk', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Monaco', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Moscow', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Oslo', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Paris', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Podgorica', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Prague', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Riga', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Rome', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Samara', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/San_Marino', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Sarajevo', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Saratov', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Simferopol', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Skopje', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Sofia', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Stockholm', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Tallinn', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Tirane', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Ulyanovsk', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Vaduz', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Vatican', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Vienna', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Vilnius', 120, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Volgograd', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Warsaw', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Zagreb', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Europe/Zurich', 60, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Antananarivo', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Chagos', 360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Christmas', 420, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Cocos', 390, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Comoro', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Kerguelen', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Mahe', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Maldives', 300, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Mauritius', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Mayotte', 180, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Indian/Reunion', 240, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Apia', 780, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Auckland', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Bougainville', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Chatham', 765, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Chuuk', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Easter', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Efate', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Fakaofo', 780, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Fiji', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Funafuti', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Galapagos', -360, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Gambier', -540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Guadalcanal', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Guam', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Honolulu', -600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Kanton', 780, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Kiritimati', 840, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Kosrae', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Kwajalein', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Majuro', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Marquesas', -570, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Midway', -660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Nauru', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Niue', -660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Norfolk', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Noumea', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Pago_Pago', -660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Palau', 540, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Pitcairn', -480, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Pohnpei', 660, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Port_Moresby', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Rarotonga', -600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Saipan', 600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Tahiti', -600, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Tarawa', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Tongatapu', 780, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Wake', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('Pacific/Wallis', 720, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO timezones (iana_id, base_offset_minutes, is_dst_supported) VALUES ('UTC', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('auth_lockout_minutes', '15', 'Duration of account lockout in minutes', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('auth_max_attempts', '5', 'Maximum failed login attempts before lockout', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('cache_default_ttl_seconds', '3600', 'Default TTL for cache entries in seconds', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('complaint_max_file_size_mb', '25', 'Maximum file size for complaint attachments in MB', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('complaint_max_files_per_complaint', '5', 'Maximum number of files per complaint', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('default_ondemand_horizon_weeks', '2', 'Default rolling horizon in weeks for on-demand instance generation', '2026-08-10T22:49:32.155Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('default_ondemand_no_credits_outcome', 'AUTO_CANCEL', 'Default action when on-demand instance has no credits at session time: AUTO_CANCEL, AUTO_ABSENT_NO_CREDITS, REMIND_ONLY', '2026-08-10T22:49:32.155Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('default_timezone', 'UTC', 'Default fallback timezone for the system', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::APP_THEME_PRESET', '', 'Built-in preset theme ID (e.g. emerald / ocean / sunset / rose / indigo / slate). Applied server-side at runtime as the preset-theme fallback (decision §14). DB override applies at request time.', '2026-08-24T04:19:57.552Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::BLOB_READ_WRITE_TOKEN', '', 'Read/write token for Vercel Blob storage access.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CACHE_PROVIDER', '', 'Active cache backend (redis or postgres).', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_CLASS_REMINDERS_SCHEDULE', '', 'Cron schedule for class reminders (default: 0 6 * * * = daily 06:00 UTC)', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_EXECUTION_MODE', '', 'Cron execution mode: vercel (Pro, every-min ticker) | vercel-daily (Hobby, daily only) | external (cron-job.org/QStash/GitHub Actions) | standalone (separate worker)', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_EXTERNAL_ENABLED', '', 'Enable external cron scheduler integration. When true, documents the external endpoint for services like cron-job.org, QStash, GitHub Actions.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_EXTERNAL_ENDPOINT', '', 'External cron endpoint path (default: /api/cron/ticker). The endpoint that external schedulers will call.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_EXTERNAL_SCHEDULE', '', 'Cron schedule for external scheduler (default: * * * * * = every minute). Used by external services like cron-job.org, QStash, GitHub Actions.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_EXTERNAL_SECRET', '', 'Secret for external cron authentication (default: CRON_SECRET). Used in Authorization: Bearer header.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_FX_REFRESH_SCHEDULE', '', 'Cron schedule for FX rate refresh (default: 0 6 * * * = daily 06:00 UTC)', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_QUEUE_BACKEND', '', 'Queue backend for cron job execution (PG_BOSS, BULLMQ_POSTGRES, BULLMQ_REDIS, CUSTOM_SQL).', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_QUEUE_MAX_BATCH', '', 'Maximum number of cron runs the ticker claims per invocation.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_QUEUE_WORKER_CONCURRENCY', '', 'Number of concurrent jobs the in-process worker can execute.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_QUEUE_WORKER_TIMEOUT', '', 'Maximum duration in milliseconds for the standalone cron worker before it exits (default: 270000 = 4.5 minutes).', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::CRON_TICKER_SCHEDULE', '', 'Cron schedule for ticker (default: * * * * * = every minute). Only used in ''vercel'' mode.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::EMAIL_PROVIDER', '', 'Active transactional email provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::ENABLE_LOGGING', '', 'Server-side master switch for verbose server logging and the /api/logs client-log ingestion route.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::FIREBASE_CLIENT_EMAIL', '', 'Firebase service-account client email for FCM push notifications.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::FIREBASE_PRIVATE_KEY', '', 'Firebase service-account private key (PEM) for FCM push notifications.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::FIREBASE_PROJECT_ID', '', 'Firebase project ID for FCM push notifications.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::FIXER_API_KEY', '', 'API key for the Fixer.io FX provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::FX_PROVIDER', '', 'Active exchange-rate provider. Mirror of the existing `fx_provider` system setting.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GCP_BUCKET_NAME', '', 'Google Cloud Storage bucket name used by the GCP storage backend.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GCP_PROJECT_ID', '', 'Google Cloud project ID used by the GCP storage backend.', '2026-08-10T22:50:33.066Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GCP_SECRET_ID', '', 'Identifier of the GCP Secret Manager secret holding storage service-account credentials.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GCP_SECRET_VERSION', '', 'Version string for the GCP Secret Manager secret that holds the storage service-account credentials.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GOOGLE_MEET_CLIENT_ID', '', 'Google Meet OAuth client ID.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GOOGLE_MEET_CLIENT_SECRET', '', 'Google Meet OAuth client secret.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GOOGLE_MEET_IMPERSONATE_SUBJECT', '', 'Google Workspace user email to impersonate for Meet space creation.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::GOOGLE_MEET_SERVICE_ACCOUNT_JSON', '', 'Google service-account JSON key for Google Meet (Domain-Wide Delegation).', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::LOCAL_STORAGE_PATH', '', 'Local filesystem path where uploads are written when STORAGE_PROVIDER=local.', '2026-08-10T22:50:33.066Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::MS_TEAMS_CLIENT_ID', '', 'Microsoft Teams (Entra ID) app registration client ID.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::MS_TEAMS_CLIENT_SECRET', '', 'Microsoft Teams (Entra ID) app registration client secret.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::MS_TEAMS_ORGANIZER_USER_ID', '', 'Entra user object ID of the Teams meeting organizer.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::MS_TEAMS_REQUIRED_SCOPES', '', 'Comma-separated OAuth scopes required for Microsoft Teams client-credentials OAuth.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::MS_TEAMS_TENANT_ID', '', 'Microsoft Teams (Entra ID) tenant ID for client-credentials OAuth.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::NEXT_PUBLIC_APP_BRANDING', '', 'JSON string of default appearance fields (colors, logo, site name/title/description, default color scheme). Parsed server-side at runtime as the tier-4 fallback when no DB row exists (AC-26). DB override applies at request time — NOT build-time-inlined into client bundles.', '2026-08-24T04:19:57.552Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::NEXT_PUBLIC_ENABLE_USERS_DIRECTORY', '', 'Enables the consolidated Users directory at `/users` (set to "true" or "false"). DB override applies at runtime for navigation and page redirects.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::OAUTH_REDIRECT_BASE_URL', '', 'Base URL for per-teacher OAuth callback redirects.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::OPENEXCHANGERATES_APP_ID', '', 'App ID for the OpenExchangeRates FX provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::PUSH_PROVIDER', '', 'Active push-notification provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::REDIS_PROVIDER', '', 'Active Redis backend (local or upstash).', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::REDIS_URL', '', 'Connection URL for the local/self-hosted Redis instance.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::RESEND_API_KEY', '', 'API key for the Resend email provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::RESEND_FROM_EMAIL', '', 'Default `From:` address for outbound transactional email via Resend.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::SIGNED_URL_CLEANUP_CRON_SCHEDULE', '', 'Cron expression for the signed-URL cleanup job (used when strategy includes `cron`).', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::SIGNED_URL_CLEANUP_STRATEGY', '', 'Strategy for cleaning up expired signed URLs (lazy / cron / both / disabled).', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::SMS_PROVIDER', '', 'Active SMS provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::STORAGE_PROVIDER', '', 'Active storage backend for uploaded files.', '2026-08-24T04:19:57.551Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::TWILIO_ACCOUNT_SID', '', 'Twilio account SID.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::TWILIO_AUTH_TOKEN', '', 'Twilio auth token.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::TWILIO_FROM_NUMBER', '', 'Originating phone number for outbound SMS via Twilio.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::UPSTASH_REDIS_REST_TOKEN', '', 'REST token for the Upstash Redis provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::UPSTASH_REDIS_REST_URL', '', 'REST URL for the Upstash Redis provider.', '2026-08-10T22:50:33.067Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_API_VERSION', '', 'WhatsApp Cloud API version (e.g., v21.0).', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_APP_ID', '', 'WhatsApp App ID for webhook validation.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_APP_SECRET', '', 'App secret used for webhook HMAC verification.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_PHONE_NUMBER_ID', '', 'Default phone number ID for the WhatsApp Business account.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_PROVIDER', '', 'WhatsApp API provider (cloud_api).', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_VERIFY_TOKEN', '', 'Verify token for WhatsApp webhook GET verification.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_WABA_ID', '', 'Default WhatsApp Business Account ID for account sync.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::WHATSAPP_WEBHOOK_BASE_URL', '', 'Base URL for WhatsApp webhooks.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::ZOOM_ACCOUNT_ID', '', 'Zoom Server-to-Server OAuth account ID.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::ZOOM_CLIENT_ID', '', 'Zoom Server-to-Server OAuth client ID.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::ZOOM_CLIENT_SECRET', '', 'Zoom Server-to-Server OAuth client secret.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('env::ZOOM_REQUIRED_SCOPES', '', 'Comma-separated OAuth scopes required for Zoom Server-to-Server OAuth.', '2026-08-10T22:50:33.068Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('feature_flags', '{"new_dashboard":false}', 'Feature flags JSON', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('maintenance_mode', 'false', 'Maintenance mode flag', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('ondemand_no_credits_resolution_lead_minutes', '240', 'Minutes before session start to resolve on-demand instances with no credits', '2026-08-10T22:49:32.155Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('ondemand_teacher_digest_hour', '9', 'Local hour (0-23) for daily teacher digest of on-demand classes with no credits', '2026-08-10T22:49:32.155Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('parent_handbook_url', 'public/docs/parent-handbook.pdf', 'Default download URL for the parent handbook', '2026-08-24T04:24:52.372Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('password_reset_expiry_hours', '24', 'Expiration time for password reset tokens in hours', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('quota_low_balance_threshold_percent', '20', 'Percentage of totalClasses at which quota low-balance notification fires', '2026-08-10T22:49:32.155Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('session_absent_waiting_minutes', '30', 'Minutes to wait before student can be marked absent', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('session_activation_window_before_minutes', '5', 'Minutes before scheduled start time that a session can be activated', '2026-08-24T04:24:52.374Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('session_leave_reschedule_offset_days', '7', 'Days offset to reschedule when leave is processed', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('session_missed_grace_minutes', '15', 'Minutes after scheduled end time before an unactivated class is auto-marked as missed', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('sms_rate_limit_per_hour', '3', 'Maximum SMS messages per parent per hour', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('student_max_leaves', '2', 'Maximum number of leave requests a student can make per calendar month', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('teacher_handbook_url', 'public/docs/teacher-handbook.pdf', 'Default download URL for the teacher handbook', '2026-08-24T04:24:52.364Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('teacher_max_leaves', '2', 'Maximum number of leave requests a teacher can make per calendar month', '2026-08-24T04:24:52.375Z');
--> statement-breakpoint
INSERT OR IGNORE INTO system_settings (key, value, description, updated_at) VALUES ('teacher_support_contact_staff_profile_id', '', 'Staff profile ID of the teacher support coordinator displayed on the teacher schedule page', '2026-08-10T22:49:31.395Z');