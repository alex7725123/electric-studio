import sys
from motorengine import ASCENDING, DESCENDING
from motorengine.errors import InvalidDocumentError
from app.models.packages import Package, UserPackage
from bson.objectid import ObjectId
import tornado
import json
    
def find(self):
    has_first_timer = False
    if self.get_secure_cookie('loginUserID'):
        user_id = str(self.get_secure_cookie('loginUserID'), 'UTF-8')
        ft_package_count = (yield UserPackage.objects.filter(user_id=ObjectId(user_id), package_ft=True).count()) 
        if ft_package_count > 0:
            has_first_timer = True

    epacks = yield Package.objects.filter(special_package=True).order_by('credits', direction=ASCENDING).find_all()
    if has_first_timer:
        packages = yield Package.objects.filter(first_timer=False,special_package=False).order_by('credits', direction=ASCENDING).find_all()
        self.render_json(packages)
    else: 
        ftPackages = yield Package.objects.filter(first_timer=True,special_package=False).order_by('credits', direction=ASCENDING).find_all();
        packages = yield Package.objects.filter(first_timer=False,special_package=False).order_by('credits', direction=ASCENDING).find_all()
        self.render_json(epacks+ftPackages+packages)
