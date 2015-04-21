from hurricane.web import RouteProvider 
routes = RouteProvider()

routes.when('admin.index', 'auth.admin')

routes.get('/', 'home.index')
routes.get('/buy', 'home.buy')
routes.post('/buy', 'home.buy')
routes.get('/verify', 'home.verify')
routes.post('/verify', 'home.verify')
routes.get('/fpass', 'home.forgot_password')
routes.post('/fpass', 'home.forgot_password')
routes.post('/user/login', 'home.login')
routes.get('/user/logout', 'home.logout')
routes.post('/upload/instructor', 'upload.instructor')
routes.post('/upload/images', 'upload.images')

# to be remove
routes.get('/add_default_sudopass', 'home.add_default_sudopass')
routes.get('/add_regular_schedules', 'home.add_regular_schedule')
routes.get('/test_waitlist', 'home.test_waitlist')
routes.get('/remove_test_waitlist', 'home.remove_test_waitlist')
routes.get('/package_migrate', 'home.package_migrate')

routes.prefix('/admin', [

    ('get', '/?', 'admin.index'),
    ('get', '/buy', 'admin.buy'),
    ('post', '/buy', 'admin.buy'),
    ('get', '/login', 'admin.login'),
    ('post', '/login', 'admin.login'),
    ('get', '/logout', 'admin.logout'),

    ('resource', '/security', 'admin.security'),
    ('resource', '/transaction', 'admin.transaction'),
    ('resource', '/statistic', 'admin.statistic'),
    ('resource', '/package', 'admin.package'),
    ('resource', '/user', 'admin.user'),
    ('resource', '/schedule', 'admin.schedule'),
    ('resource', '/instructor/schedules', 'admin.instructor_schedules'),
    ('resource', '/slider', 'admin.slider'),

    ('get', '/export/download-bookings', 'admin.export.download_bookings'),
    ('get', '/export/waitlist', 'admin.export.waitlist')
])

routes.prefix('/api', [
    ('resource', '/admin', 'api.admin'),
    ('resource', '/user', 'api.user'),
    ('resource', '/package', 'api.package'),
    ('resource', '/instructor', 'api.instructor'),
    ('resource', '/transaction', 'api.transaction'),
    ('resource', '/schedule', 'api.schedules'),
    ('resource', '/book', 'api.book'),
    ('resource', '/history', 'api.history')
])

routes.subdomain('api.electric-studio.dev', [
    ('resource', 'user', 'api.user')
])

