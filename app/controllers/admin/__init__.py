from app.models.admins import Admin
from passlib.hash import bcrypt
from app.models.packages import Package, UserPackage
from app.models.users import User
from app.helper import send_email_verification, send_email
from bson.objectid import ObjectId
from datetime import timedelta
import sys
import tornado
import json
import base64

def index(self):
    self.render('admin', user=self.get_secure_cookie('admin'))

def login(self):
    if self.request.method == 'GET':
        message = self.flash_secure_cookie('admin_login_invalid')
        if not message:
            message = ''
        self.render('login', message=message)
    else:
        username = self.get_argument('username')
        password = self.get_argument('password')

        admin = yield Admin.objects.get(username=username)
        invalid = False
        try:
            if not admin or not bcrypt.verify(password, admin.password):
                invalid = True
        except ValueError:
            invalid = True
        if invalid:
            self.set_secure_cookie('admin_login_invalid', 'Invalid username and password')
            self.redirect('/admin/login')

        self.set_secure_cookie('admin', admin.username)
        self.redirect('/admin/')

def logout(self):
    self.clear_cookie('admin')
    self.redirect('/admin/')

def buy(self):
    success = self.get_argument('success')
    if success == 'True':
        pp_tx = self.get_query_argument('tx')
        pp_st = self.get_query_argument('st')
        pp_amt = self.get_query_argument('amt')
        pp_cc = self.get_query_argument('cc')
        pp_cm = self.get_query_argument('cm')
        pp_item = self.get_query_argument('item_number')

        if not pp_tx:
            self.set_status(403)
            self.redirect('admin/#/accounts?s=error')
            return
 
        data = {
            'transaction' : pp_tx,
            'status' : pp_st,
            'amount' : pp_amt,
            'curency' : pp_cc,
            'cm' : pp_cm,
            'item_number' : pp_item
        }

        payment_exist = yield UserPackage.objects.get(trans_info=str(data));
        if payment_exist:
            self.redirect('/admin/#/accounts?s=exists#packages')
            return;
     
        try: 
            pid = self.get_argument('pid');
            package = yield Package.objects.get(pid)
            if pid:
                user_id = self.get_argument('uid')
                user = yield User.objects.get(user_id)
                
                if user and user.status != 'Frozen' and user.status != 'Unverified':
                    transaction = UserPackage()
                    transaction.user_id = user._id
                    transaction.package_id = package._id
                    transaction.package_name = package.name
                    transaction.package_fee = package.fee
                    transaction.credit_count = package.credits
                    transaction.remaining_credits = package.credits
                    transaction.expiration = package.expiration
                    transaction.trans_info = str(data)
                    user.credits += package.credits

                    transaction = yield transaction.save()
                    user = yield user.save()

                    user = (yield User.objects.get(user._id)).serialize()
                    site_url = url = self.request.protocol + '://' + self.request.host + '/#/schedule'
                    exp_date = transaction.create_at + timedelta(days=transaction.expiration)
                    content = str(self.render_string('emails/buy', user=user, site=site_url, package=package.name, expire_date=exp_date.strftime('%B %d, %Y')), 'UTF-8')
                    yield self.io.async_task(send_email, user=user, content=content, subject='Package Purchased')

                    self.redirect('/admin/#/accounts?pname=' + package.name + '&u=' + user['first_name'] + ' ' + user['last_name'] + '&s=success')
                else:
                    self.set_status(403)
                    self.write('Invalid User Status')
                    self.finish()
            else:
                self.set_status(403)
                self.write('Package not found')
                self.finish()
        except:
            value = sys.exc_info()[1]
            self.set_status(403)
            self.write(str(value))  
            self.finish()
    else:
        self.redirect('/admin/#/accounts')

