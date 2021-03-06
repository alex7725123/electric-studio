from bson.objectid import ObjectId
from app.models.users import User
from app.models.packages import Package, UserPackage, UserProduct, Product
from app.auth import auth_token, create_token
from datetime import datetime, timedelta
from app.helper import send_email

import sys
import tornado

def request_token(self):
    header = self.request.headers
    if 'ES-Branch' in header and 'ES-Password' in header:
        branch_id = header['ES-Branch']
        password = header['ES-Password']

        result = yield create_token(branch_id, password)
        self.set_status(result['status'])       
        self.render_json(result)
    else:
        self.set_status(404)
        self.redirect('/#/notfound')

def buy(self):
    message, success, status = '', False, 400
    package_id = self.get_argument('package_id')
    user_id = self.get_argument('user_id')
    trans_id = self.get_argument('trans_id')
    if user_id and package_id:
        package = yield Package.objects.get(package_id) 
        user = yield User.objects.get(user_id)
        if user:
            if user.status !='Frozen' and user.status !='Unverified' and user.status != 'Deactivated':
                if package:
                    ft_package_count = (yield UserPackage.objects.filter(user_id=ObjectId(user._id), package_ft=True).count()) 
                    if ft_package_count > 0 and package.first_timer:
                        message = 'Invalid transaction: User already have a first_timer package'
                    else:
                        if not trans_id:
                            trans_id = str(user._id) + datetime.now().strftime('%Y%m%d%H%M%S')

                        transaction = UserPackage()
                        transaction.user_id = user._id
                        transaction.package_id = package._id
                        transaction.package_name = package.name
                        transaction.package_fee = package.fee
                        transaction.package_ft = package.first_timer
                        transaction.credit_count = package.credits
                        transaction.remaining_credits = package.credits
                        transaction.expiration = package.expiration
                        transaction.expire_date = datetime.now() + timedelta(days=package.expiration)
                        transaction.trans_id = trans_id
                        transaction.trans_info = ''
                        user.credits += package.credits

                        transaction = yield transaction.save()
                        user = yield user.save()

                        user = (yield User.objects.get(user._id)).serialize()
                        site_url = url = self.request.protocol + '://' + self.request.host + '/#/schedule'
                        exp_date = transaction.create_at + timedelta(days=transaction.expiration)

                        # content = str(self.render_string('emails/buy', user=user, site=site_url, package=package.name, expire_date=exp_date.strftime('%B. %d, %Y')), 'UTF-8')
                        # yield self.io.async_task(send_email, user=user, content=content, subject='Package Purchased')

                        self.render_json(transaction)
                        return
                else:
                    message = 'Invalid transaction: No package found with this id ' + package_id
            else:
                message = 'Invalid transaction: User ' + user.status
        else:
            message = 'Invalid transaction: Required ES user account'
    else:
        message = 'Invalid params. Please provide valid user and package id'
    
    result = {
        'message' : message,
        'valid' : success,
        'status' : status
    }           

    self.set_status(status)
    self.render_json(result)

def buy_product(self):
    message, success, status = '', False, 400
    product_id = self.get_argument('product_id')
    user_id = self.get_argument('user_id')
    quantity = self.get_argument('quantity')
    if user_id and product_id and quantity:
        quantity = int(quantity)
        product = yield Product.objects.get(product_id) 
        user = yield User.objects.get(user_id)
        if user:
            if user.status !='Frozen' and user.status !='Unverified' and user.status != 'Deactivated':
                if product:
                    transaction = UserProduct()
                    transaction.user_id = user._id
                    transaction.product_id = product._id
                    transaction.product_name = product.name
                    transaction.product_amount = product.amount
                    transaction.quantity = quantity
                    product.quantity -= quantity

                    transaction = yield transaction.save()
                    product = yield product.save()

                    self.render_json(transaction)
                    return
                else:
                    message = 'Invalid transaction: No product found with this id ' + product_id
            else:
                message = 'Invalid transaction: User ' + user.status
        else:
            message = 'Invalid transaction: Required ES user account'
    else:
        message = 'Invalid params. Please provide valid user id, product id and quantity'
    
    result = {
        'message' : message,
        'valid' : success,
        'status' : status
    }           

    self.set_status(status)
    self.render_json(result)

    

