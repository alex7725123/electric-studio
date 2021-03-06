import sys
from datetime import datetime, timedelta
from motorengine.errors import InvalidDocumentError
from app.models.packages import Package, GiftCertificate, UserPackage
from app.models.users import User
from bson.objectid import ObjectId
from app.helper import create_at_gmt8, code_generator
from app.helper import GMT8
from motorengine import DESCENDING

import tornado
import json
import tornado.escape
import string

def find(self):
    page_limit = 10
    page = 0
    transactions = []

    searchKeyword = self.get_query_argument('queryString')
    startDate = self.get_query_argument('fromDate')
    endDate = self.get_query_argument('toDate')
    isRedeemed = (self.get_query_argument('isRedeemed') == 'true')
    
    # fromDate = datetime.strptime(datetime.now().strftime('%Y-%m-%d'), '%Y-%m-%d')
    fromDate = None
    if startDate:
        fromDate = datetime.strptime(startDate, '%Y-%m-%d')
    # toDate = datetime.now() + timedelta(days=7)
    toDate = None
    if endDate: 
        toDate = datetime.strptime(endDate, '%Y-%m-%d')

    # create_at__gte=fromDate, create_at__lte=toDate, 
    gc_query = GiftCertificate.objects
    if isRedeemed:
        gc_query.filter(is_redeemed=isRedeemed)
    if fromDate and toDate:
        gc_query.filter(create_at__gte=fromDate, create_at__lte=toDate)

    total = 0
    if isRedeemed: total = (yield GiftCertificate.objects.filter(is_redeemed=isRedeemed).count());
    else: total = (yield GiftCertificate.objects.count());

    if self.get_argument('page'):
        page = int(self.get_argument('page'))
    gift_certificates = []

    if(total - (page * page_limit)) > 0:
        gc_query.order_by('create_at', direction=DESCENDING) \
                .skip(page * page_limit).limit(page_limit)
        gift_certificates = yield gc_query.find_all()
    gift_certificates = create_at_gmt8(gift_certificates)

    # gift_certificates_filtered = []
    # if searchKeyword:
    #     for gift_certificate in gift_certificates:
    #         if searchKeyword in gift_certificate.code or searchKeyword in gift_certificate.receiver_email or searchKeyword in gift_certificate.pptx or searchKeyword in gift_certificate.sender_email:
    #             gift_certificates_filtered = gift_certificate

    self.render_json(gift_certificates)

def find_one(self, id):
    gift_certificate = yield GiftCertificate.objects.get(id)
    self.render_json(gift_certificate)

def create(self):
    # create batch gcs
    data = tornado.escape.url_unescape(self.request.body)
    gc_data = tornado.escape.json_decode(data)
    count = int(gc_data['count'])
    pid = gc_data['package_id']

    for i in range(count):
        try:
            gift_certificate = GiftCertificate()
            code = code_generator()
            pin = int(code_generator(4, string.digits))
            package = yield Package.objects.get(pid)

            if package:
                gift_certificate.package_id = package._id
                gift_certificate.amount = package.fee
                gift_certificate.credits = package.credits
                gift_certificate.validity = package.expiration
                gift_certificate.pin = pin
                gift_certificate.code = code

            gift_certificate = yield gift_certificate.save()
        except:
            value = sys.exc_info()[1]
            self.set_status(403)
            self.write('ERROR: ' + str(value))
            self.finish()
    self.finish()

def update(self, id):

    data = tornado.escape.url_unescape(self.request.body)
    redeem_data = tornado.escape.json_decode(data)
    try :
        code = redeem_data['code']
        pin = redeem_data['pin']
        user_id = redeem_data['user_id']
        gift_certificate = yield GiftCertificate.objects.get(code=code, pin=pin) # 
        user = yield User.objects.get(user_id)
        
        if gift_certificate:
            if gift_certificate.is_redeemed:
                self.set_status(403)
                self.write('Gift card has already been redeemed.')
                return self.finish()
            else:

                # get user and package
                package = yield Package.objects.get(gift_certificate.package_id._id)

                if package.first_timer:
                    ft_package_count = (yield UserPackage.objects.filter(user_id=ObjectId(user_id), package_ft=True).count()) 
                    if ft_package_count > 0:
                        self.set_status(403)
                        self.write('User ' + user.email + ' already have first timer package.')
                        return self.finish()

                gift_certificate.is_redeemed = True

                # ES account is required to redeem
                gift_certificate.redeemer_es_id = user._id
                gift_certificate.redeem_date = datetime.now()

                # # save this into user transaction
                transaction = UserPackage()
                transaction.user_id = user._id
                transaction.package_id = package._id
                transaction.package_name = 'GC - ' + package.name
                transaction.package_fee = package.fee
                transaction.package_ft = package.first_timer
                transaction.credit_count = gift_certificate.credits
                transaction.remaining_credits = gift_certificate.credits
                transaction.expiration = gift_certificate.validity
                transaction.expire_date = datetime.now() + timedelta(days=gift_certificate.validity)
                if gift_certificate.pptx:
                    transaction.trans_id = gift_certificate.pptx
                else:
                    transaction.trans_id = str(gift_certificate._id) + datetime.now().strftime('%Y%m%d%H%M%S')
                transaction.trans_info = gift_certificate.trans_info
                user.credits += gift_certificate.credits

                gift_certificate = yield gift_certificate.save()
                transaction = yield transaction.save()
                user = yield user.save()

                return self.render_json(gift_certificate.to_dict())
        else:
            self.set_status(403)
            self.write('Incorrect card code or pin. Please try again.')
            self.finish()
    except :
        value = sys.exc_info()[1]
        self.set_status(403)
        self.write(str(value))
        self.finish()

def destroy(self, id):
    self.set_status(403)
    self.finish()
