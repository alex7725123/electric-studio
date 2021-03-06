'use strict';

var ctrls = angular.module('elstudio.controllers.admin', [
  'elstudio.services',
  'angularFileUpload'
]);

ctrls.controller('UserCtrl', function ($scope, AdminService, AccessService, SecurityService) {

  $scope.showAddUser = function () {
    $scope.newUser = {};
    $scope.newUser.access_type = 'Staff';
    angular.element('#add-user-modal').Modal();
  }

  AdminService.query(function (users) {
    $scope.users = {};
    var user_tmp = [];
    var i = 0;
    angular.forEach(users, function (user) {
      AccessService.get({ accessId : user.access_type }, function (accessInfo) {
        i++;
         $scope.users[i] = user;
         $scope.users[i]['admin_type'] = accessInfo.admin_type
      })
    });
  });

  $scope.addUser = function () {

    if ($scope.newUser) {
      if (!$scope.newUser.first_name) {
        $.Alert('User must have first name')
        return;
      }

      if (!$scope.newUser.last_name) {
        $.Alert('User must have last name')
        return;
      }

      if (!$scope.newUser.email) {
        $.Alert('User must have email address')
        return;
      }

      if (!$scope.newUser.password || $scope.newUser.password.length == 0) {
        $.Alert('Password is required');
        return;
      }

      if ($scope.newUser.password && $scope.newUser.password.length < 6) {
        $.Alert('Password must be at least 6 characters.');
        return;
      }

      if ($scope.newUser.password != $scope.newUser.confirm_password) {
        $.Alert("Password didn't match");
        return;
      }


      var addSuccess = function () {
        AdminService.query(function (users) {
          $scope.users = {};
          var user_tmp = [];
          var i = 0;
          angular.forEach(users, function (user) {
            AccessService.get({ accessId : user.access_type }, function (accessInfo) {
              i++;
               $scope.users[i] = user;
               $scope.users[i]['admin_type'] = accessInfo.admin_type
            })
          });
        });
        $scope.newUser = null;
        angular.element('#close-add-user').click();
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      AdminService.create($scope.newUser).$promise.then(addSuccess, addFail);
    }
  }

  var chkSecurity = function (securityCallback) {

    $('#btn-security').off('click');
    $('#btn-security').click(function () {
      $scope.$apply(function () {
        if ($scope.securityPass) {
          SecurityService.check({ sudopass: $scope.securityPass }, function () {
            securityCallback();
            $scope.securityPass = null;
          }, function (error) {
            $.Alert(error.data);
            $scope.securityPass = null;
          });
        } else {
          $.Alert('Access Denied');
          $scope.securityPass = null;
        }
      });
    });

    $('#security-check-modal').Modal();
  }

  $scope.setToUpdate = function (user) {
    $scope.isUpdateUser = true;
    $scope.updateUser = user;
  }

  $scope.cancelUpdateUser = function () {
    $scope.isUpdateUser = false;
    $scope.updateUser = null;
  }

  $scope.setUser = function () {

    if ($scope.updateUser) {
      var updateSuccess = function () {
        AdminService.query(function (users) {
          $scope.users = {};
          var user_tmp = [];
          var i = 0;
          angular.forEach(users, function (user) {
            AccessService.get({ accessId : user.access_type }, function (accessInfo) {
              i++;
               $scope.users[i] = user;
               $scope.users[i]['admin_type'] = accessInfo.admin_type
            })
          });
        });
        $scope.isUpdateUser = false;
        $scope.updateUser = null;
      }

      var updateFail = function (error) {
        $.Alert(error.data);
      }
      AdminService.update({ adminId: $scope.updateUser._id }, $scope.updateUser).$promise.then(updateSuccess, updateFail);
    }
  }

  $scope.removeUser = function (user) {
    $.Confirm('Are you sure you want to delete ' + user.first_name+ ' ?', function () {
      var removeSuccess = function () {
        AdminService.query().$promise.then(function (data) {
          $scope.users = data;
        });
      }

      var removeFailed = function (error) {
        $.Alert(error.data);
      }

      // chkSecurity(function () {
        AdminService.delete({adminId : user._id}).$promise.then(removeSuccess, removeFailed);
      // });
    });
  }
});

ctrls.controller('PackageCtrl', function ($scope, PackageService) {

  $scope.showAddPackage = function () {
    angular.element('#add-package-modal').Modal();
  }

  $scope.packages = PackageService.query();
  $scope.packages.$promise.then(function (data) {
    $scope.packages = data;
  });

  $scope.addPackage = function () {

    if ($scope.newPackage) {

      if (!$scope.newPackage.fee) {
        $.Alert('Package must have price')
        return;
      }

      if (!$scope.newPackage.credits) {
        $.Alert('Package must have number of credits')
        return;
      }

      var addSuccess = function () {
        PackageService.query().$promise.then(function (data) {
          $scope.packages = data;
        });
        $scope.newPackage = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      PackageService.create($scope.newPackage).$promise.then(addSuccess, addFail);
    }
  }

  $scope.setToUpdate = function (pac) {
    $scope.isUpdatePackage = true;
    $scope.updatePackage = pac;
  }

  $scope.cancelUpdatePackage = function () {
    $scope.isUpdatePackage = false;
    $scope.updatePackage = null;
  }

  $scope.setPackage = function () {

    if ($scope.updatePackage) {
      var addSuccess = function () {
        PackageService.query().$promise.then(function (data) {
          $scope.packages = data;
        });
        $scope.isUpdatePackage = false;
        $scope.updatePackage = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      PackageService.update({ packageId: $scope.updatePackage._id }, $scope.updatePackage).$promise.then(addSuccess, addFail);
    }
  }

  $scope.removePackage = function (pac) {
    $.Confirm('Are you sure on deleting ' + pac.name + ' ?', function () {
      var addSuccess = function () {
        PackageService.query().$promise.then(function (data) {
          $scope.packages = data;
        });
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      PackageService.delete({packageId : pac._id}).$promise.then(addSuccess, addFail);
    });
  }
});

ctrls.controller('AccountCtrl', function ($scope, $timeout, $interval, $location, UserService, PackageService, TransactionService, ClassService, SecurityService, EmailVerifyService) {

  var qstring = $location.search();
  if (qstring.s) {
    if (qstring.s == 'success' && qstring.pname) {
      $.Alert('Success! You have bought ' + qstring.pname + ' package for ' + qstring.u);
    } else if (qstring.s == 'exists') {
      $.Alert('Transaction already exists');
    } else if (qstring.s == 'error') {
      var msg = '';
      if (qstring.msg) {
        msg = ' : ' + qstring.msg;
      }
      $.Alert('Transaction failed' + msg);
    }
    $location.search({ s: null, pname: null });
  }

  $scope.newCredits = {};
  UserService.query({ deactivated: true}, function (users) {
    $scope.users = users;
  });

  var select = angular.element('#select-add-package')[0].selectize;
  var selectBuy = angular.element('#select-buy-package')[0].selectize;
  PackageService.query(function (packages) {
    $scope.packages = packages;
    angular.forEach(packages, function (pack) {
      select.addOption({ value: pack._id, text: pack.name  || pack.credits + ' Ride' + (pack.credits > 1 ? 's' : '' ) });
      selectBuy.addOption({ value: pack._id, text: pack.name  || pack.credits + ' Ride' + (pack.credits > 1 ? 's' : '' )});
    
         // angular.forEach(summary.packages, function (pack_val, pack_key) {
            //   $scope.checkExpirationDate(pack_val);
            //     // var tmp_date = new Date(pack_val.create_at);
            //     // tmp_date = new Date(tmp_date.setDate(tmp_date.getDate() + pack_val.expiration)).setHours(0,0,0,0);
            //     // var cur_date = new Date().setHours(0,0,0,0);
            //     // if (tmp_date < cur_date) {
            //     //   pack_val.is_expired = true;
            //     // } else if (tmp_date == cur_date) {
            //     //   pack_val.is_expired = 'expired';
            //     // } else {
            //     //   pack_val.is_expired = false;
            //     // }
            // });
    });
  });

  $scope.searchingAccount = false;
  $scope.searchAccount = function () {
    if ($scope.searchText && !$scope.searchingAccount) {
      $scope.searchingAccount = true;
      $timeout(function () {
        UserService.query({ deactivated: true, search: $scope.searchText }, function (users) {
          $scope.users = users;
          $scope.searchingAccount = false;
        }, function () { $scope.searchingAccount = false });
      }, 100);
    }
  }

  $scope.loadingAccounts = false;
  $scope.loadMoreAccounts = function () {
    if (!$scope.loadingAccounts) {
      $scope.loadingAccounts = true;
      // $timeout(function () {
        UserService.query({ deactivated: true, search: $scope.searchText, skip: $scope.users.length }, function (users) {
          $scope.users = $scope.users.concat(users);
          $scope.loadingAccounts = false;
        }, function () { $scope.loadingAccounts = false });
      // }, 100);
    }
  }



  $scope.showAddAccount = function () {
    angular.element('#add-account-modal').Modal();
  }

  $scope.registeringAccount = false;
  $scope.addAccount = function () {
    if ($scope.newAccount) {
      if (!$scope.newAccount.email || $scope.newAccount.email.length == 0) {
        $.Alert('Email Address is required');
        return;
      }

      if (!$scope.newAccount.password || $scope.newAccount.password.length == 0) {
        $.Alert('Password is required');
        return;
      }

      if ($scope.newAccount.password && $scope.newAccount.password.length < 6) {
        $.Alert('Password must be at least 6 characters.');
        return;
      }

      if ($scope.newAccount.password != $scope.newAccount.confirm_password) {
        $.Alert("Password didn't match");
        return;
      }

      $scope.registeringAccount = true;
      var registerSuccess = function () {
        $.Alert('Successfully added new account')
        UserService.query({ deactivated: true}, function (users) {
          $scope.users = users;
        });

        if (!$scope.newAccount.no_email) {
          $scope.sendEmailConfirmation($scope.newAccount);
        }
        angular.element('#close-add-account').click();
        $scope.newAccount = {}
        $scope.registeringAccount = false;
      }

      var registerFail = function (error) {
        $scope.registered = false;

        var errorMsg = error.data
        if (errorMsg.split(' ').length === 2) {
          errorMsg = errorMsg + ' is required';
        }

        $.Alert(errorMsg);
        $scope.registeringAccount = false;
      }

      UserService.create($scope.newAccount).$promise.then(registerSuccess, registerFail);
    } else {
      $.Alert('Please fill form to add account')
    }
  }

  $scope.sendEmailConfirmation = function (user) {

    var sendEmailSuccess = function () {
      $.Alert('Email Veification link have been sent to ' + user.email + '.');
    }

    var sendEmailFailed = function (error) {
      $.Alert(error.data);
    }

    EmailVerifyService.email_verify(user)
                      .$promise.then(sendEmailSuccess, sendEmailFailed);
  }

  $scope.accountInfo = function (user) {
    $scope.selectedInfo = user;

    UserService.get({ userId : user._id }, function (userInfo) {
      var initialData = {
        birthdate: '',
        address: '',
        contact_person: '',
        emergency_contact: '',
        notes: '',
        phone_number: ''
      };

      $scope.selectedInfo = angular.extend(initialData, userInfo);

      if ($scope.selectedInfo.birthdate) {
        $scope.selectedInfo.birthdate = $scope.selectedInfo.birthdate.replace(' 00:00:00', '');
      }

      angular.element('#account-info-modal').Modal();
    });
  }

  $scope.updateAccountInfo = function () {
    if ($scope.selectedInfo) {
      var updateSuccess = function () {
        $.Alert('Successfully updated account information.');
      }

      var updateFail = function (error) {
        $.Alert(error.data)
      }

      delete $scope.selectedInfo.billing;
      UserService.update({ userId: $scope.selectedInfo._id }, $scope.selectedInfo).$promise.then(updateSuccess, updateFail);
    }
  }

  $scope.verifyAccount = function (user) {
    var username = user.first_name + ' ' + user.last_name;
    $.Confirm('Are you sure to verify account ' + username + ' - ' + user.email, function () {

      var verifySuccess = function () {
        $.Alert('Successfully verify account ' + username);
        UserService.query({ deactivated: true}, function (users) {
          $scope.users = users;
        });
      }

      var verifyFailed = function (error) {
        $.Alert(error.data);
      }
      UserService.update({ userId: user._id }, { verify: true }, verifySuccess, verifyFailed);
    });
  }

  $scope.deactivateAccount = function (user, index) {
    var username = user.first_name + ' ' + user.last_name;
    $.Confirm('Are you sure you want to deactivate ' + username + ' account?' , function () {
      var deactivateSuccess = function () {
        $.Alert('Successfully deactivated account ' + username);
        UserService.query({ deactivated: true}, function (users) {
          $scope.users = users;
        });
      }
      var deactivateFailed = function (error) {
        $.Alert(error.data);
      }
      UserService.update({ userId: user._id }, { deactivate: true }, deactivateSuccess, deactivateFailed);
      // chkSecurity(function () {});
    });
  }

  $scope.activateAccount = function (user, index) {
    var username = user.first_name + ' ' + user.last_name;
    $.Confirm('Are you sure you want to activate ' + username + ' account?' , function () {
      var activateSuccess = function () {
        $.Alert('Successfully activated account ' + username);
        UserService.query({ deactivated: true}, function (users) {
          $scope.users = users;
        });
      }
      var activateFailed = function (error) {
        $.Alert(error.data);
      }
      UserService.update({ userId: user._id }, { activate: true }, activateSuccess, activateFailed);
    });
  }

  $scope.selectPackage = function (packageId) {
    for (var i in $scope.packages) {
      if ($scope.packages[i]._id == packageId) {
        $scope.newCredits.expiration = $scope.packages[i].expiration;
        break;
      }
    }
  }

  $scope.setPackage = function (packageId) {
    for (var i in $scope.packages) {
      if ($scope.packages[i]._id == packageId) {
        $scope.newPackage = $scope.packages[i];
        break;
      }
    }
  }

  $scope.accountAddClass = function (user) {
    //chkSecurity(function () {
      $scope.newCredits.user_id = user._id;
      $scope.selectedAccount = user;
      angular.element('#add-class-modal').Modal();
    //});
  }

  $scope.buyPackageModal = function (user) {
  var select = angular.element('#select-add-package')[0].selectize;
  var selectBuy = angular.element('#select-buy-package')[0].selectize;

    PackageService.query({buyer_id: user._id}, function (packages) {
      $scope.packages = packages;
      selectBuy.clearOptions();
      select.clearOptions();
      angular.forEach(packages, function (pack) {
        select.addOption({ value: pack._id, text: pack.name  || pack.credits + ' Ride' + (pack.credits > 1 ? 's' : '' ) });
        selectBuy.addOption({ value: pack._id, text: pack.name  || pack.credits + ' Ride' + (pack.credits > 1 ? 's' : '' )});
      });
    });

    var port = '';
    if (window.location.port)
      port = ':' + window.location.port;

    $scope.redirectUrl = window.location.protocol + '//' + window.location.hostname + port +'/admin';

    //chkSecurity(function () {
      $scope.selectedAccount = user;
      if (!($scope.selectedAccount.billing instanceof Object)) {
        $scope.selectedAccount.billing = JSON.parse($scope.selectedAccount.billing);
        if (!($scope.selectedAccount.billing instanceof Object)) {
          $scope.selectedAccount.billing = {};
        }
      }
      angular.element('#buy-package-modal').Modal();
    //});
  }

  var chkSecurity = function (securityCallback) {

    $('#btn-security').off('click');
    $('#btn-security').click(function () {
      $scope.$apply(function () {
        if ($scope.securityPass) {
          SecurityService.check({ sudopass: $scope.securityPass }, function () {
            securityCallback();
            $scope.securityPass = null;
          }, function (error) {
            $.Alert(error.data);
            $scope.securityPass = null;
          });
        } else {
          $.Alert('Access Denied');
          $scope.securityPass = null;
        }
      });
    });

    $('#security-check-modal').Modal();
  }

  $scope.confirmBilling = function () {
    if ($scope.newPackage) {
      // angular.element('#billing-preview-modal').Modal();
      $.Alert('redirecting to paypal ... ');
      angular.element('#admin-pay-form').submit();
    } else {
      $.Alert('Please select a package');
    }
  }

  $scope.onDateRange = function (user) {
    if ($scope.dateFilter && $scope.dateFilter != '0') {
      if ($scope.selectedOption == 'withAvailable') {
        return user.books.length < stat.seats;
      } else if ($scope.selectedOption == 'withWaitlisted') {
        return user.waitlist.length > 0;
      }
    }
    return true;
  }

  // $scope.buyPackage = function () {

  //   if ($scope.selectedAccount.billing &&
  //       $scope.selectedAccount.billing != 'null') {
  //     if ($scope.selectedAccount.billing.first_name &&
  //         $scope.selectedAccount.billing.last_name &&
  //         $scope.selectedAccount.billing.address &&
  //         $scope.selectedAccount.billing.city &&
  //         $scope.selectedAccount.billing.province &&
  //         $scope.selectedAccount.billing.postalcode &&
  //         $scope.selectedAccount.billing.email &&
  //         $scope.selectedAccount.billing.phone_a &&
  //         $scope.selectedAccount.billing.phone_b &&
  //         $scope.selectedAccount.billing.phone_c &&
  //         $scope.selectedAccount.billing.card_number  &&
  //         $scope.selectedAccount.billing.card_type &&
  //         $scope.selectedAccount.billing.card_expiration &&
  //         $scope.selectedAccount.billing.csc) {

  //       var billingSuccess = function () {
  //         $.Alert('Successfully save billing information. Now were redirecting you to paypal');
  //         angular.element('#admin-pay-form').submit();
  //       }

  //       var billingFail = function (error) {
  //         $.Alert(error.data)
  //       }
  //       UserService.update({ userId: $scope.selectedAccount._id }, { billing: $scope.selectedAccount.billing }).$promise.then(billingSuccess, billingFail);

  //     } else {
  //       $.Alert('Billing information is not complete to process the transaction');
  //       $timeout(function () {
  //         angular.element('#billing-preview-modal').Modal();
  //       }, 10);
  //     }
  //   } else {
  //     $.Alert('Please provide billing information');
  //     $timeout(function () {
  //       angular.element('#billing-preview-modal').Modal();
  //     }, 10);
  //   }
  // }

  $scope.checkExpirationDate = function (pack_val) {
     var tmp_date = new Date(pack_val.create_at);
    tmp_date = new Date(tmp_date.setDate(tmp_date.getDate() + pack_val.expiration)).setHours(0,0,0,0);
    var cur_date = new Date().setHours(0,0,0,0);
    if (tmp_date < cur_date) {
      pack_val.is_expired = true;
    } else if (tmp_date == cur_date) {
      pack_val.is_expired = 'expired';
    } else {
      pack_val.is_expired = false;
    }


    return pack_val;
  }

  $scope.accountSummary = function (user) {
    $scope.currentPage = 0;
    $scope.selectedAccount = user;
    UserService.get({ userId: user._id }, function (summary) {
      $scope.selectedAccount = summary;
    });
    angular.element('#account-summary-modal').Modal();
  }

  $scope.prevPage = function (event) {
    if ($scope.currentPage > 0) {
      $scope.currentPage -=1;
      UserService.get({ userId: $scope.selectedAccount._id, page: $scope.currentPage }, function (summary) {
        $scope.selectedAccount = summary;
      });
    }
    event.preventDefault();
  }

  $scope.nextPage = function (event) {
    UserService.get({ userId: $scope.selectedAccount._id, page: $scope.currentPage+1 }, function (summary) {
      if(summary.packages.length > 0){
        $scope.selectedAccount = summary;
        $scope.currentPage+=1;
      }
    });
    event.preventDefault();
  }

  $scope.getTransId = function (pac) {
    if (pac.trans_info) {
      if (!(pac.trans_info instanceof Object)) {
        try {
          var transInfo = pac.trans_info.replace(/\"/g, '');
          transInfo = transInfo.replace(/'/g, '"');
          var trans = JSON.parse(transInfo);
          pac.trans_info = trans;
          return trans.transaction;
        } catch (e) {
          if (pac.trans_id) {
            return pac.trans_id;
          } else {
            return 'Err: Transaction ID';
          }
        }
      } else {
        return pac.trans_info.transaction;
      }
    } else if (pac.trans_id) {
      return pac.trans_id;
    }

    return 'Err: Transaction ID';
  }


  var from_input = angular.element('#input_from').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), from_picker = from_input.pickadate('picker')

  var to_input = angular.element('#input_to').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), to_picker = to_input.pickadate('picker')

  // Check if there’s a “from” or “to” date to start with.
  if (from_picker.get('value')) {
    to_picker.set('min', from_picker.get('select'));
  }
  if (to_picker.get('value')) {
    from_picker.set('max', to_picker.get('select'));
  }

  // When something is selected, update the “from” and “to” limits.
  from_picker.on('set', function (event) {
    if (event.select) {
      to_picker.set('min', from_picker.get('select'));
    }
    else if ('clear' in event) {
      to_picker.set('min', false);
    }
  });
  to_picker.on('set', function (event) {
    if (event.select) {
      from_picker.set('max', to_picker.get('select'));
    }
    else if ('clear' in event) {
      from_picker.set('max', false);
    }
  });

  $scope.changeCredits = function (userPack) {
    TransactionService.get({ transactionId: userPack._id, book_count: true }, function(bookCount) {
      var numCredits = userPack.credit_count - bookCount['count'];
      angular.element('#set-credits')[0].selectize.clearOptions()
      if (numCredits > 0) {
        $scope.selectedUPack = userPack;
        var selectize = angular.element('#set-credits')[0].selectize;
        selectize.settings.sortField = 'text';
        selectize.settings.sortDirection = 'desc';
        for (var i = numCredits; i >= 0 ; i--)
          selectize.addOption({ value: i, text: i });
        angular.element('#update-credits-modal').Modal();
      } else {
        $.Alert("All credits already been used for booking");
      }
    });
  }

  $scope.setCredits = function () {
    if ($scope.selectedCredits != undefined && $scope.selectedCredits != null) {
      var confirm_msg = 'Are you sure to change credit from (' + $scope.selectedUPack.remaining_credits + ') to ' + $scope.selectedCredits + '?';
      $.Confirm(confirm_msg, function () {
        $.Alert('Updating credits from ' + $scope.selectedUPack.remaining_credits + ' to ' + $scope.selectedCredits + ' ...', true);
        TransactionService.update({ transactionId: $scope.selectedUPack._id}, { credit_change: parseInt($scope.selectedCredits) }, function () {
          UserService.get({ userId: $scope.selectedUPack.user_id._id }, function (summary) {
            $scope.selectedAccount = summary;
          });
          UserService.query({ deactivated: true}, function (users) {
            $scope.users = users;
          });
          $.Alert('Successfully update credits');
        }, function (error) { $.Alert(error.data); })
      });
    } else {
      $.Alert('Please select bike to switch')
    }
  }

  $scope.extendPackageExpiry = function (userpackage) {
    $.Prompt('Extend expiration by how many days ?', function (days) {
      if (parseInt(days) && parseInt(days) > 0) {
        $.Alert('Extending expiration ...', true);
        TransactionService.update({ transactionId: userpackage._id}, { extend: parseInt(days) }, function () {
          UserService.get({ userId: userpackage.user_id._id }, function (summary) {
            $scope.selectedAccount = summary;
          });
          UserService.query({ deactivated: true}, function (users) {
            $scope.users = users;
          });
          $.Alert('Successfully extend package expiration');
        }, function (error) { $.Alert(error.data); })
      } else {
        $.Alert('Please put valid number of days to extend');
      }
    });
  }

  $scope.moveBikeModal = function (book) {
    ClassService.query({ date: book.date.replace(' 00:00:00',''), sched_id: book.schedule._id, seats: true }, function (seats) {
      $scope.selectedBook = book;
      if (seats.available.length) {
        var selectize = angular.element('#switch-seat')[0].selectize;
        selectize.settings.sortField = 'text';
        angular.forEach(seats.available, function (seat) {
          selectize.addOption({ value: seat, text: seat });
        });

        angular.element('#switch-bike-modal').Modal();
      } else {
        $.Notify({ content: 'No seats available to switch' });
      }
    });
  }

  $scope.moveBike = function () {
    if ($scope.selectedBike && !isNaN($scope.selectedBike) && parseInt($scope.selectedBike) > 0 && parseInt($scope.selectedBike) <= $scope.schedDetails.seats) {
      var confirm_msg = 'Are you sure to switch you bike (' + $scope.selectedBook.seat_number + ') to ' + $scope.selectedBike + '?';
      $.Confirm(confirm_msg, function () {
        $.Alert('Switching bike from ' + $scope.selectedBook.seat_number + ' to ' + $scope.selectedBike + ' ...', true);
        ClassService.update({ scheduleId: $scope.selectedBook._id }, { move_to_seat : $scope.selectedBike }, function () {
          $scope.filterSchedDate($scope.selectedAccount);
          $.Alert('Successfully moved bike');
        }, function (error) {
          $.Notify({ content: error.data });
        });
      });
    } else {
      $.Notify({ content: 'Invalid bike number' });
    }
  }

  $scope.missedModal = function(booking){
    $scope.selectedBook = booking;
    angular.element('#missed-booking-modal').Modal();
  }

  $scope.missedBooking = function () {
     $.Confirm('Are you sure on marking ' + $scope.selectedBook.user_id.first_name + ' ' + $scope.selectedBook.user_id.last_name + ' ride as MISSED ? (THIS CANNOT BE UNDONE)', function () {
       $.Alert('Marking schedule as missed ...', true);
       ClassService.delete({ scheduleId: $scope.selectedBook._id, missed: true, notes:$scope.missedNotes }, function () {
          $.Alert('Successfully marked as missed');
          $scope.filterSchedDate($scope.selectedAccount);
       });
     });
  }

  $scope.cancelBooking = function (booking) {
    $.Confirm('Are you sure on canceling ' + booking.user_id.first_name + ' ' + booking.user_id.last_name + ' ride ?', function () {
      $.Prompt('Notes on canceling ' + booking.user_id.first_name + ' ride', function (notes) {
        if (notes && notes.length > 0) {
          $.Alert('Canceling ...', true);
          ClassService.delete({ scheduleId: booking._id, notes: notes }, function () {
            $scope.filterSchedDate($scope.selectedAccount);
            $.Alert('Successfully canceled');
          });
        } else {
          $.Alert('Please provide a notes on canceling schedules');
        }
      });
    });
  }

  $scope.cancelWaitlist = function (index, sched) {
    ClassService.delete({ scheduleId: sched._id }, function () {
      $scope.filterSchedDate($scope.selectedAccount);
      $.Alert('Successfully canceled waitlisted schedule');
    });

  }

  $scope.filterSchedDate = function (user) {
    if ($scope.schedFilter) {
      var fromDate = $scope.schedFilter.fromDate;
      var toDate = $scope.schedFilter.toDate;
      UserService.get({ userId: user._id, books: true, fromDate: fromDate, toDate: toDate }, function (userWithScheds) {
        $scope.selectedAccount = userWithScheds;
      });
    } else {
      $.Alert('Please select a valid date values');
    }
  }

  $scope.accountSchedules = function (user) {
    $scope.selectedAccount = user;
    var date = new Date();
    from_picker.set('select', new Date());
    to_picker.set('select', [date.getFullYear(), date.getMonth(), date.getDate() + 7]);
    $scope.schedFilter = {};
    $scope.schedFilter.fromDate = from_picker.get('value');
    $scope.schedFilter.toDate = to_picker.get('value');
    UserService.get({ userId: user._id, books: true }, function (userWithScheds) {
      $scope.selectedAccount = userWithScheds;

      angular.element('#account-schedules-modal').Modal();
    });
  }

  $scope.saveNewCredits = function () {
    $scope.saving = true;
    TransactionService.save($scope.newCredits, function (credits) {
      $scope.saving = false;
      $scope.newCredits = {};
      $scope.selectedAccount.credits += credits.credit_count
    }, function (error) {
      $.Notify({ content: error.data });
    });
  }

  $scope.frozeModal = function (user) {
    $scope.selectedAccount = user;
    angular.element('#froze-account-modal').Modal();
  }

  $scope.freezeAccount = function () {
    if ($scope.selectedAccount && $scope.frozeReason && $scope.frozeReason.length > 0) {
      var account_name = $scope.selectedAccount.first_name + ' ' + $scope.selectedAccount.last_name;
      $.Confirm('Are you sure on freezing (' + account_name + ') account?', function () {

        var freezeSuccess = function () {
          $.Alert('Successfully freeze account ' + account_name)
          UserService.query({ deactivated: true}, function (users) {
            $scope.users = users;
          });
        }

        var freezeFailed = function (error) {
          $.Alert(error.data);
        }

        UserService.update({ userId: $scope.selectedAccount._id }, { froze_account: $scope.frozeReason }, freezeSuccess, freezeFailed);
      });
    } else {
      $.Alert('Please input a reason on freezing an account');
    }
  }

  $scope.unFrozeAccount = function (user) {
    var name = user.first_name + ' ' + user.last_name;
    $.Confirm('Are you sure you want to unfreeze ' + name + ' account ?', function () {

      var unFrozeSuccess = function () {
        $.Alert('Successfully unfreeze account ' + name)
        UserService.query({ deactivated: true}, function (users) {
          $scope.users = users;
        });
      }

      var unFrozeFailed = function (error) {
        $.Alert(error.data);
      }

      UserService.update({ userId: user._id }, { unfroze: true }, unFrozeSuccess, unFrozeFailed);
    });
  }

  $scope.downloadUserAccounts = function () {
    var emailFilter = $scope.searchText;
    var past_month = $scope.dateFilter;
    if (!past_month){
      past_month = '';
    }
    if (!emailFilter) {
      emailFilter = '';
    }


    $.Alert('Please wait ...', true);
    var url = '/admin/export/download-user-accounts?email=' + emailFilter + '&past_month=' + past_month + '&start=now';
    $.get(url, function (response) {
      if(response.success && response.data){
        $.Alert('exporting users ' + response.data, true);
      } else if (response.file) {
        $interval.cancel(timeInval);
        window.location = response.file;
      }
    });

    // get export status
    var timeInval = $interval(function () {
      var url = '/admin/export/download-user-accounts';
      $.get(url, function (response) {
        if(response.success && response.data){
          $.Alert('exporting ' + response.data, true);
        } else if (response.file) {
          $interval.cancel(timeInval);
          $.Alert('Successfully exported accounts');
          window.location = response.file;
        }
      });
    }, 3000)


    // window.location = '/admin/export/download-user-accounts?email=' + emailFilter + '&past_month=' + past_month
  }

});


ctrls.controller('ClassCtrl', function ($scope, $timeout, ClassService, UserService, SettingService) {

  $scope.newBook = {};
  var dateToday = new Date();
  $scope.newBook.date = dateToday.getFullYear() + '-' + (dateToday.getMonth() + 1) +'-' + dateToday.getDate();

  angular.element('#class-tabs').Tab();

  $scope.reloadDate = function () {
    angular.element('#select-class-time')[0].selectize.clearOptions();
    $scope.newBook.sched_id = null;
    $scope.newBook.time = null;
    $scope.reload();
  }

  $scope.reload = function () {
    $scope.books = null;
    $scope.waitList = null;
    $scope.schedDetails = null;
    ClassService.query({ date: $scope.newBook.date, time: $scope.newBook.time, sched_id: $scope.newBook.sched_id }, function (books) {
      $scope.books = books.bookings;
      $scope.waitList = books.waitlist;
      $scope.schedDetails = books.schedule;
      $scope.firstTimers = books.first_timers;
      if (books.schedules.length) {
        $scope.blockedBikes = {};
        SettingService.getBlockedBikes(function (bikes) {
          $scope.blockedBikes = bikes;
        });
        var selectize = angular.element('#select-class-time')[0].selectize;

        angular.forEach(books.schedules, function (sched) {
          selectize.addOption({ value: sched.id, text: sched.text });
        });
        if (!$scope.newBook.sched_id) {
          $timeout(function () {
            selectize.setValue(books.schedules[0].id);
          }, 400);
        }
      }
    });

    UserService.query(function (users) {
      $scope.users = users;
    });
  }
  $scope.reloadDate();

  $scope.getBlockedSeats = function () {
    if ($scope.schedDetails && $scope.schedDetails.branch) {
      var seats = $scope.schedDetails.branch.num_bikes;
      for (var k in $scope.blockedBikes) {
        var key = parseInt(k)
        if (key && key <= $scope.schedDetails.branch.num_bikes) {
          seats -= 1;
        }
      }
      return seats;
    }

    return 0;
  }

  UserService.query({frozen: false}, function (users) {
    $scope.users = users;
    var select = angular.element('#select-user-id')[0].selectize;
    var selectWaitlist = angular.element('#select-waitlist-user')[0].selectize;
    angular.forEach(users, function (user) {
      select.addOption({ value: user._id, text: user.first_name + ' ' + user.last_name + ' - ' + user.email });
      selectWaitlist.addOption({ value: user._id, text: user.first_name + ' ' + user.last_name + ' - ' + user.email });
    });
  });

  $scope.selectRider = function () {
    for (var i in $scope.users) {
      if ($scope.users[i]._id == $scope.newBook.user_id) {
        $scope.selectedRider = $scope.users[i];
        break;
      }
    }
  }

  $scope.selectWaitlistRider = function () {
    for (var i in $scope.users) {
      if ($scope.users[i]._id == $scope.newWaitlist.user_id) {
        $scope.selectedRider = $scope.users[i];
        break;
      }
    }
  }

  $scope.isCompleted = function (sched, is_cancel) {

    var now = new Date();
    var dateParts = sched.date.split(/[^0-9]/);
    var timeParts = sched.end.split(/[^0-9]/);
    var plusDay = is_cancel ? 1 : 0;
    var date =  new Date(dateParts[0], dateParts[1]-1, dateParts[2]+plusDay, timeParts[3], timeParts[4], timeParts[5]);
    if (date < now)
      return true;

    return false

  }

  $scope.missedModal = function(booking, index){
    $scope.selectedBook = booking;
    $scope.spliceIndex = index;
    angular.element('#missed-booking-modal').Modal();
  }

  $scope.missedBooking = function () {
    if (!$scope.isCompleted($scope.selectedBook.schedule)) {
      var index = $scope.spliceIndex;
      var notes = $scope.missedNotes;
      $.Confirm('Are you sure on marking ' + $scope.selectedBook.user_id.first_name + ' ' + $scope.selectedBook.user_id.last_name + ' ride as MISSED ? (THIS CANNOT BE UNDONE)', function () {
        $.Alert('Marking ' + $scope.selectedBook.user_id.first_name + ' ' + $scope.selectedBook.user_id.last_name + ' ride as MISSED ...', true);
        ClassService.delete({ scheduleId: $scope.selectedBook._id, missed: true, notes: notes }, function () {
          $scope.books.splice(index, 1);
          UserService.query(function (users) {
            $scope.users = users;
          });
          $.Alert('Successfully marked as missed');
        }, function (error) {
          $.Alert(error.data);
        });
      });

    } else {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
    }
  }

  $scope.cancelBooking = function (booking, index) {
    if (!$scope.isCompleted(booking.schedule, true)) {

      $.Confirm('Are you sure on cancelling ' + booking.user_id.first_name + ' ' + booking.user_id.last_name + ' ride ?', function () {
        $.Prompt('Notes on cancelling ' + booking.user_id.first_name + ' ride', function (notes) {
          if (notes && notes.length > 0) {
            $.Alert('Canceling ride ...', true);
            $scope.books.splice(index, 1);
            ClassService.delete({ scheduleId: booking._id, notes: notes }, function () {
              UserService.query(function (users) {
                $scope.users = users;
              });
              $.Alert('Successfully canceled');
            }, function (error) {
              $.Alert(error.data);
            });
          } else {
            $.Alert('Please provide a notes on cancelling schedules');
          }
        });
      });
    } else {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
    }
  }

  $scope.sendNewBook = function () {

    var now = new Date();
    var parts = $scope.schedDetails.end.split(/[^0-9]/);
    var dTime =  new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
    var hours = dTime.getHours();
    var minutes = dTime.getMinutes();
    var chkDate = new Date($scope.newBook.date);
    chkDate.setHours(hours, minutes, 0, 0);
    chkDate.setDate(chkDate.getDate() + 1);
    if (chkDate < now) {
      $.Notify({ content: 'Booking is not allowed anymore' });
      return;
    }

    var nextMonth = new Date(now.getFullYear(), now.getMonth()+1, now.getDate());
    if (chkDate > nextMonth) {
      $.Notify({ content: 'Booking 1 month in advance is prohibited' });
      return;
    }
    $scope.booking = true;
    $.Alert('Booking bike # ' + $scope.newBook.seat_number + ' ...', true);
    ClassService.save($scope.newBook, function (savedBook) {
      $scope.reload();
      angular.element('#select-user-id')[0].selectize.setValue('');
      $scope.booking = false;
      $('#alert-close-btn').click();
    }, function (error) {
      $('#alert-close-btn').click();
      $scope.booking = false;
      $.Notify({ content: error.data });
    });
  }

  $scope.addNewWaitlist = function () {
    var now = new Date();
    var parts = $scope.schedDetails.start.split(/[^0-9]/);
    var dTime =  new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
    var hours = dTime.getHours();
    var minutes = dTime.getMinutes();
    var chkDate = new Date($scope.newWaitlist.date);
    chkDate.setHours(hours, minutes, 0, 0);
    if (chkDate < now) {
      $.Notify({ content: 'This schedule is completed' });
      return;
    }

    $scope.newWaitlist.status = 'waitlisted';
    $scope.waitlisting = true;
    $.Alert('waitlisting user ' + $scope.selectedRider.first_name + ' ' + $scope.selectedRider.last_name + ' ...', true);
    ClassService.save($scope.newWaitlist, function (savedBook) {
      $scope.reload();
      angular.element('#select-waitlist-user')[0].selectize.setValue('');
      $scope.waitlisting = false;
      $('#alert-close-btn').click();
    }, function (error) {
      $scope.waitlisting = false
      $('#alert-close-btn').click();
      $.Notify({ content: error.data });
    });
  }

  $scope.bookRide = function () {
    if(!$scope.newBook.sched_id) {
      $.Alert('Please select schedule date and time');
      return;
    }

    if($scope.isCompleted($scope.schedDetails)) {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
      return;
    }

    if($scope.books.length === $scope.schedDetails.branch.num_bikes) {
      $.Alert('No available seats');
      return;
    }

    var unavailableBikes = [];
    angular.forEach($scope.books, function(booking) {
      unavailableBikes.push( booking.seat_number );
    });

    angular.element('#select-bike-number')[0].selectize.clearOptions();
    var selectbike = angular.element('#select-bike-number')[0].selectize;
    selectbike.settings.sortField = 'text';

    for(var i = 1; i <= $scope.schedDetails.branch.num_bikes; i++) {
      if(unavailableBikes.indexOf(i) >= 0) continue;

      selectbike.addOption({ value: i, text: i });
    }

    $scope.selectedRider = {};
    angular.element('#select-user-id')[0].selectize.setValue('');
    angular.element('#book-ride-modal').Modal();
  }

  $scope.addWaitlistModal = function () {
    if ($scope.newBook.sched_id) {
      if (!$scope.isCompleted($scope.schedDetails)) {
        $scope.newWaitlist = {};
        $scope.newWaitlist.sched_id = $scope.newBook.sched_id;
        $scope.newWaitlist.date = $scope.newBook.date;
        $scope.selectedRider = {};
        angular.element('#select-waitlist-user')[0].selectize.setValue('');
        angular.element('#add-waitlist-modal').Modal();
      } else {
        $.Notify({ content: 'Not allow to modify, This schedule is completed' });
      }
    } else {
      $.Alert('Please select schedule date and time');
    }
  }

  $scope.switchBikeModal = function (book) {
    if($scope.isCompleted($scope.schedDetails)) {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
      return;
    }

    if($scope.books.length === $scope.schedDetails.branch.num_bikes) {
      $.Notify({ content: 'No seats available to switch' });
      return;
    }

    $scope.selectedBook = book;

    var unavailableBikes = [];
    angular.forEach($scope.books, function(booking) {
      unavailableBikes.push( booking.seat_number );
    });

    var selectize = angular.element('#switch-seat')[0].selectize;
    selectize.clearOptions();
    selectize.settings.sortField = 'text';

    for(var i = 1; i <= $scope.schedDetails.branch.num_bikes; i++) {
      if(unavailableBikes.indexOf(i) >= 0) continue;

      selectize.addOption({ value: i, text: i });
    }

    angular.element('#switch-bike-modal').Modal();
  }

  $scope.switchBike = function () {
    if ($scope.selectedBike && !isNaN($scope.selectedBike) && parseInt($scope.selectedBike) > 0 && parseInt($scope.selectedBike) <= $scope.schedDetails.seats) {
      var confirm_msg = 'Are you sure to switch you bike (' + $scope.selectedBook.seat_number + ') to ' + $scope.selectedBike + '?';
      $.Confirm(confirm_msg, function () {
        $.Alert('Switching bike from ' + $scope.selectedBook.seat_number + ' to ' + $scope.selectedBike + ' ...', true);
        ClassService.update({ scheduleId: $scope.selectedBook._id }, { move_to_seat : $scope.selectedBike }, function () {
          $scope.reload();
          $.Alert('Successfully switched bike');
        }, function (error) {
          $.Notify({ content: error.data });
        });
      });
    } else {
      $.Notify({ content: 'Invalid bike number' });
    }
  }

  $scope.moveToClass = function (wait) {
    if (!$scope.isCompleted($scope.schedDetails)) {
      ClassService.query({ date: $scope.newBook.date, sched_id: $scope.newBook.sched_id, seats: true }, function (seats) {
        $scope.selectedWaitList = wait;
        if (seats.available.length) {
          var selectize = angular.element('#select-seat')[0].selectize;
          selectize.clearOptions();
          selectize.settings.sortField = 'text';
          angular.forEach(seats.available, function (seat) {
            selectize.addOption({ value: seat, text: seat });
          });

          angular.element('#move-to-class-modal').Modal();
        } else {
          $.Notify({ content: 'No seats available' });
        }
      });
    } else {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
    }
  }

  $scope.bookWaitList = function () {

    if (!isNaN($scope.selectedWaitList.seat_number) && parseInt($scope.selectedWaitList.seat_number) > 0 && parseInt($scope.selectedWaitList.seat_number ) <= $scope.schedDetails.seats) {
      $.Alert('Moving waitlist to bike ' + $scope.selectedWaitList.seat_number + ' ...', true);
      ClassService.update({ scheduleId: $scope.selectedWaitList._id }, { move_to_seat : $scope.selectedWaitList.seat_number, waitlist: true }, function () {
        $scope.reload();
        $.Alert('Successfully moved waitlist');
      }, function (error) {
        $.Notify({ content: error.data });
        $('#alert-close-btn').click();
      });
    } else {
      $.Notify({ content: 'Invalid bike number' });
    }
  }

  $scope.removeFromWaitlist = function (wait, index) {
    if (!$scope.isCompleted(wait.schedule)) {
      $.Confirm('Are you sure on cancelling ' + wait.user_id.first_name + ' waitlist ?', function () {
        $.Alert('Canceling waitlist ...', true);
        $scope.waitList.splice(index, 1);
        ClassService.delete({ scheduleId: wait._id }, function () {
          UserService.query(function (users) {
            $scope.users = users;
          });
          $.Alert('Successfully canceled waitlist');
        });
      });
    } else {
      $.Notify({ content: 'Not allow to modify, This schedule is completed' });
    }
  }

  $scope.releaseWaitlist = function () {
    if (!$scope.newBook.sched_id) {
      $.Alert('Please select a valid schedule');
      return;
    }

    if (!$scope.waitList || $scope.waitList.length <= 0) {
      $.Notify({ content: 'No waitlist found to release' });
      return;
    }

    $.Confirm('Are you sure on cancelling all waitlist for this schedule ?', function () {
      $scope.waitList = [];
      ClassService.delete({ scheduleId: 'None', sched_id: $scope.newBook.sched_id, waitlist: true });
    });
  }

  $scope.printWaitlist = function () {
    if (!$scope.newBook.sched_id) {
      $.Alert('Please select a valid schedule');
      return;
    }

    if ($scope.waitList && $scope.waitList.length > 0) {
      window.location = '/admin/export/waitlist?sched_id=' + $scope.newBook.sched_id;
    } else {
      $.Alert('No waitlist schedule found');
    }
  }

  $scope.downloadBookingList = function () {
    if (!$scope.newBook.sched_id) {
      $.Alert('Please select a valid schedule');
      return;
    }
    if ($scope.books && $scope.books.length) {
      window.location = '/admin/export/download-bookings?sched_id=' + $scope.newBook.sched_id;
    } else {
      $.Notify({ content: 'No booked schedule found'});
    }
  }

  $scope.isBlocked = function (seat) {
    if ($scope.blockedBikes && $scope.blockedBikes[seat]) {
      return true;
    }
    return false;
  }

  $scope.checkSeat = function (seat) {
    if ($scope.schedDetails && $scope.books) {
      for (var b in $scope.books) {
        if ($scope.books[b].seat_number == seat) {
          return true;
        }
      }
    }

    return false;
  }

  $scope.viewBikeMap = function () {
    if (!$scope.newBook.sched_id) {
      $.Alert('Please select a valid schedule');
      return;
    }

    if (!$scope.isCompleted($scope.schedDetails)) {
      SettingService.getBlockedBikes(function (bikes) {
        $scope.blockedBikes = bikes;
      });

      var bikeMap = '#bike-map-' + $scope.schedDetails.branch.name.toLowerCase();
      angular.element( bikeMap ).Modal();
    } else {
      $.Notify({ content: 'This schedule is completed' });
    }
  }

});

ctrls.controller('ClassTypeCtrl', function ($scope, ClassTypeService) {

  $scope.classTypes = ClassTypeService.query();
  $scope.classTypes.$promise.then(function (data) {
    $scope.classTypes = data;
  });

  $scope.showAddClassType = function () {
    angular.element('#add-class-type-modal').Modal();
  }

  $scope.addClassType = function () {

    if ($scope.newClassType) {

      if (!$scope.newClassType.name) {
        $.Alert('Class type must have name')
        return;
      }

      var addSuccess = function () {
        ClassTypeService.query().$promise.then(function (data) {
          $scope.classTypes = data;
        });
        $scope.newClassType = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      ClassTypeService.create($scope.newClassType).$promise.then(addSuccess, addFail);
    }
  }

  $scope.updatingClassType = {};
  $scope.setClassType = function (ct) {

    if (ct) {
      $scope.updatingClassType[ct._id] = true;
      var addSuccess = function () {
        ClassTypeService.query().$promise.then(function (data) {
          $scope.classTypes = data;
        });
        $scope.updatingClassType[ct._id] = false;
      }

      var addFail = function (error) {
        $.Alert(error.data);
        $scope.updatingClassType[ct._id] = false;
      }

      ClassTypeService.update({ typeId: ct._id }, ct).$promise.then(addSuccess, addFail);
    }
  }

  $scope.removeClassType = function (ct) {
    $.Confirm('Are you sure on deleting ' + ct.name + ' ?', function () {
      var addSuccess = function () {
        ClassTypeService.query().$promise.then(function (data) {
          $scope.classTypes = data;
        });
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      ClassTypeService.delete({ typeId: ct._id }).$promise.then(addSuccess, addFail);
    });
  }
});


ctrls.controller('ScheduleCtrl', function ($scope, $timeout, ScheduleService, InstructorService, ClassTypeService, BranchService) {

  $scope.classTypesByName = {};
  $scope.classTypes = ClassTypeService.query();
  $scope.classTypes.$promise.then(function (data) {
    $scope.classTypes = data;
    angular.forEach($scope.classTypes, function (ct) {
      $scope.classTypesByName[ct.name] = ct;
    });
  });

  var calendar = angular.element('.calendar');
  calendar.fullCalendar({
    defaultView: 'agendaWeek',
    allDaySlot: false,
    allDay: false,
    events: function (start, end, timezone, callback) {
      var events = [];
      ScheduleService.query({ start: start.unix(), end: end.unix(), branch: $scope.selectedBranchId }, function (scheds) {
        $scope.schedules = scheds;
        angular.forEach(scheds, function (s, i) {
          s.index = i;
          events.push(s);
        });
        callback(events);
      });
    },
    // eventRender: function (event, element) {
    //   element.attr('title', event.title);
    // },
    eventMouseover: function (event, element) {
      var element = element;
      var tooltip = '<div class="cal-tooltip">' + event.title + '</div>';
      angular.element('body').append(tooltip);
      $(this).mouseover(function (e) {
        $(this).css('z-index', 10000);
        angular.element('.cal-tooltip').fadeIn('500');
        angular.element('.cal-tooltip').fadeTo('10', 1.9);
      }).mousemove(function (e) {
        angular.element('.cal-tooltip').css('top', e.pageY + 10);
        angular.element('.cal-tooltip').css('left', e.pageX + 20);
      });
    },
    eventMouseout: function (calEvent, jsEvent) {
        $(this).css('z-index', 8);
        angular.element('.cal-tooltip').remove();
    },
    eventClick: function (calEvent, jsEvent, view) {
      $scope.selectedSched = $scope.schedules[calEvent.index];
      $scope.editSched = {
        date: calEvent.start.year() + '-' + (calEvent.start.month() + 1) + '-' + calEvent.start.date(),
        start: new Date(0, 0, 0, calEvent.start.hour(), calEvent.start.minute(), 0, 0),
        end: new Date(0, 0, 0, calEvent.end.hour(), calEvent.end.minute(), 0, 0),
        id: calEvent.id
      };

      if ( $('[type="time"]').prop('type') != 'time' ) {
        $timeout(function () {
          angular.element('#edit-time-start').val($scope.selectedSched.start_time);
          angular.element('#edit-time-end').val($scope.selectedSched.end_time);
        }, 400);
      }
      angular.element('#edit-class-instructor')[0].selectize.setValue($scope.selectedSched.instructor._id);
      if ($scope.selectedSched.sub_instructor) {
        angular.element('#edit-class-sub-instructor')[0].selectize.setValue($scope.selectedSched.sub_instructor._id);
      }
      $scope.$apply();
      angular.element('#view-schedule-modal').Modal();
    }
    // windowResize: function (view) {
    //   angular.element('.calendar').fullCalendar('changeView', 'agendaDay');
    // }
  });

  var bIds = {};
  BranchService.query().$promise.then(function (branches) {
    var branchSelectize = angular.element('#select-branch')[0].selectize;
    angular.forEach(branches, function (branch) {
      bIds[branch._id] = branch;
      branchSelectize.addOption({ value: branch._id, text: branch.name });
    });

    branchSelectize.setValue(branches[0]._id);
    $scope.selectedBranch = branches[0];
    $scope.selectedBranchId = branches[0]._id;
    calendar.fullCalendar('refetchEvents');
  });

  $scope.filterByBranch = function() {
    $scope.selectedBranch = bIds[$scope.selectedBranchId];
    calendar.fullCalendar('refetchEvents');
  }

  if ( $('[type="time"]').prop('type') != 'time' ) {
    $('[type="time"]').pickatime({
      formatSubmit: 'HH:i',
      hiddenName: true,
      min: [5, 0]
    });
  }

  var addSeats = angular.element('#add-no-seats')[0].selectize;
  var editSeats = angular.element('#edit-no-seats')[0].selectize;
  addSeats.settings.sortField = 'text';
  addSeats.settings.sortDirection = 'desc';
  editSeats.settings.sortField = 'text';
  editSeats.settings.sortDirection = 'desc';
  for (var x = 37; x > 0; x--) {
    addSeats.addOption({ value: x, text: x });
    editSeats.addOption({ value: x, text: x });
  }
  addSeats.setValue(37);

  // $scope.updateRegularSchedule = function () {
  //   var updatedSched = angular.copy($scope.editRegSched);
  //   updatedSched.start = updatedSched.start.getHours() + ':' + updatedSched.start.getMinutes();
  //   updatedSched.end = updatedSched.end.getHours() + ':' + updatedSched.end.getMinutes();
  //   ScheduleService.update(
  //     { scheduleId: updatedSched.id },
  //     updatedSched,
  //     function (response) {
  //       calendar.fullCalendar('refetchEvents');
  //     },
  //     function (error) {
  //       $.Notify({ content: error.data });
  //     }
  //   );
  // }

  $scope.addSchedule = function () {
    $timeout(function () {
      var addSchedSelectize = angular.element('#add-select-schedule-type')[0].selectize;
      addSchedSelectize.clearOptions()
      angular.forEach($scope.classTypes, function (ct) {
        addSchedSelectize.addOption({ value: ct.name, text: ct.name })
      });
      addSchedSelectize.setValue('');
      angular.element('#add-class-instructor')[0].selectize.setValue('');
      angular.element('#add-class-sub-instructor')[0].selectize.setValue('');
      angular.element('#add-no-seats')[0].selectize.setValue(37);
    }, 400);
    angular.element('#add-sched-modal').Modal();
    angular.element('#add-sched-modal .modal__box').drags();
  }



  // $scope.addRegularSchedule = function () {
  //   angular.element('#add-regular-sched-modal').Modal();
  // }

  // $scope.saveRegularSchedule = function () {
  //   var newSched = angular.copy($scope.newRegSched);
  //   newSched.start = newSched.start.getHours() + ':' + newSched.start.getMinutes();
  //   newSched.end = newSched.end.getHours() + ':' + newSched.end.getMinutes();
  //   ScheduleService.save(newSched, function (response) {
  //     calendar.fullCalendar('refetchEvents');
  //     $scope.newRegSched = {};
  //   }, function (error) {
  //     $.Notify({ content: error.data });
  //     $scope.newRegSched = {};
  //   });
  // }

  var strTimeToDate = function (strTime) {
    if (strTime) {

      var timeSplit = strTime.split(' ');
      var time = timeSplit[0].split(':');
      var ampm = timeSplit[1];

      if(ampm.toLowerCase() == 'pm'){
        if (parseInt(time[0]) < 12) {
          time[0] = (parseInt(time[0]) + 12) + '';
        }
      }

      var date = new Date();
      date.setHours(parseInt(time[0]), parseInt(time[1]), 0);
      return date;
    }
  }

  $scope.isPastDate = function (sched) {
    var now = new Date();
    var date = sched.date;
    if (date instanceof Date) {
      date.setHours(sched.start.getHours(), date.start.getMinutes(), 0, 0);
    } else {
      var dateParts = sched.date.split(/[^0-9]/);
      date =  new Date(dateParts[0], dateParts[1]-1, dateParts[2], sched.start.getHours(), sched.start.getMinutes());
    }

    if (date < now) {
      return true;
    }

    return false
  }

  $scope.removeSchedule = function (sched) {
    if (sched.ridersCount > 0) {
      $.Alert('Not allowed to remove schedules has reservations')
      return;
    }

    if (!$scope.isPastDate($scope.editSched)) {
      $.Confirm('Are you sure on deleting schedule ?', function () {
        ScheduleService.delete({ scheduleId: sched.id });
        calendar.fullCalendar('removeEvents', sched.id);
      });
    } else {
      $.Alert('Not allowed remove schedule on past dates');
    }
  }

  $scope.editSchedule = function (sched) {
    $timeout(function () {
      var editSchedSelectize = angular.element('#edit-select-schedule-type')[0].selectize;
      editSchedSelectize.clearOptions()
      angular.forEach($scope.classTypes, function (ct) {
        editSchedSelectize.addOption({ value: ct.name, text: ct.name });
      });
      editSchedSelectize.setValue(sched.type);
      angular.element('#edit-class-instructor')[0].selectize.setValue(sched.instructor._id);
      if (sched.sub_instructor) {
        angular.element('#edit-class-sub-instructor')[0].selectize.setValue(sched.sub_instructor._id);
      }
      angular.element('#edit-no-seats')[0].selectize.setValue(sched.seats);
    }, 400);
    angular.element('#edit-sched-modal').Modal();
  }

  $scope.saveSchedule = function () {

    if ( $('[type="time"]').prop('type') != 'time' ) {
      $scope.newSpecSched.start = strTimeToDate(angular.element('#add-time-start').val());
      $scope.newSpecSched.end = strTimeToDate(angular.element('#add-time-end').val());
    }

    if (!$scope.newSpecSched.date ||
        !$scope.newSpecSched.type ||
        !$scope.newSpecSched.instructor ||
        !$scope.newSpecSched.start ||
        !$scope.newSpecSched.end) {
      $.Alert('Please complete schedule information');
      return;
    }

    if($scope.selectedBranchId){
      $scope.newSpecSched.branch = $scope.selectedBranchId;
    }


    if (!$scope.isPastDate($scope.newSpecSched)) {
      var newSched = angular.copy($scope.newSpecSched);
      newSched.start = newSched.start.getHours() + ':' + newSched.start.getMinutes();
      newSched.end = newSched.end.getHours() + ':' + newSched.end.getMinutes();

      if ($scope.selectedBranch) {
        newSched.seats = $scope.selectedBranch.num_bikes;
      }

      ScheduleService.save(newSched, function (response) {
        calendar.fullCalendar('refetchEvents');
        $scope.newSpecSched = {};
      }, function (error) {
        $.Notify({ content: error.data });
        $scope.newSpecSched = {};
      });
    } else {
      $.Alert('Not allowed to schedule past dates');
      $scope.newSpecSched = {};
    }
  }

  $scope.updateSchedule = function () {

    if ( $('[type="time"]').prop('type') != 'time' ) {
      $scope.editSched.start = strTimeToDate(angular.element('#edit-time-start').val());
      $scope.editSched.end = strTimeToDate(angular.element('#edit-time-end').val());
    }

    if (!$scope.editSched.date ||
        !$scope.editSched.type ||
        !$scope.editSched.instructor ||
        !$scope.editSched.start ||
        !$scope.editSched.end) {
      $.Alert('Please complete schedule information');
      return;
    }

    if (!$scope.isPastDate($scope.editSched)) {

      var updatedSched = angular.copy($scope.editSched);
      updatedSched.start = updatedSched.start.getHours() + ':' + updatedSched.start.getMinutes();
      updatedSched.end = updatedSched.end.getHours() + ':' + updatedSched.end.getMinutes();

      if ($scope.selectedBranch) {
        updatedSched.seats = $scope.selectedBranch.num_bikes;
      }

      ScheduleService.update(
        { scheduleId: updatedSched.id },
        updatedSched,
        function (response) {
          calendar.fullCalendar('refetchEvents');
        },
        function (error) {
          $.Notify({ content: error.data });
        }
      );
    } else {
      $.Alert('Not allowed to modify/set schedule on past dates');
    }
  }

  InstructorService.query(function (instructors) {
    // var regSelectize = angular.element('#add-reg-class-instructor')[0].selectize;
    var specSelectize = angular.element('#add-class-instructor')[0].selectize;
    var addSubInstructor = angular.element('#add-class-sub-instructor')[0].selectize;
    var editInstructor = angular.element('#edit-class-instructor')[0].selectize;
    var editSubInstructor = angular.element('#edit-class-sub-instructor')[0].selectize;
    angular.forEach(instructors, function (instructor) {
      // regSelectize.addOption({ value: instructor._id, text: instructor.admin.first_name + ' ' + instructor.admin.last_name });
      specSelectize.addOption({ value: instructor._id, text: instructor.admin.first_name + ' ' + instructor.admin.last_name });
      addSubInstructor.addOption({ value: instructor._id, text: instructor.admin.first_name + ' ' + instructor.admin.last_name });
      editInstructor.addOption({ value: instructor._id, text: instructor.admin.first_name + ' ' + instructor.admin.last_name });
      editSubInstructor.addOption({ value: instructor._id, text: instructor.admin.first_name + ' ' + instructor.admin.last_name });
    });
  });
});


ctrls.controller('SliderCtrl', function ($scope, $upload, SliderService) {

  $scope.sliders = SliderService.query();
  $scope.sliders.$promise.then(function (data) {
    $scope.sliders = data;
  });

  angular.element('#class-tabs').Tab();

  $scope.addSlide = function () {
    angular.element('#add-slide-modal').Modal();
  }

  $scope.uploadImage = function (files, type) {
    if (files && files[0]) {
      var file = files[0];
      if (['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.type) < 0) {
        $.Alert('Invalid file type');
        return;
      } else if (file.size > (1024 * 1024 * 3)) {
        $.Alert('Must not exceed 3MB');
        return;
      }

      $upload.upload({
        url: '/upload/images',
        method: 'POST',
        data: { 'type' : type },
        file: file
      }).then(
        function (e) {
          $('#' + type).attr('src', $('#' + type).attr('src') + '?timestamp=' + new Date().getTime());
        },
        function (e) {
          $scope.uploading = false;
          $.Alert(e.data);
        },
        function (e) {
          var progress = parseInt(100.0 * e.loaded / e.total);
          if (progress < 100)
          $.Notify({ content: 'Uploading (' + progress + '%)' });
        }
      );
    }
  }

  $scope.uploadSlider = function (files, ftype) {
    if (files && files[0]) {
      var file = files[0];
      if (['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.type) < 0) {
        $.Alert('Invalid file type');
        return;
      } else if (file.size > (1024 * 1024 * 3)) {
        $.Alert('Must not exceed 3MB');
        return;
      }
      if (ftype && ftype == 'mobile') $scope.forMobileFile = file;
      else $scope.toUploadFile = file;
    } else {
      if (ftype && ftype == 'mobile') $scope.forMobileFile = null;
      else $scope.toUploadFile = null;
    }
  }

  $scope.saveSlider = function () {
    if ($scope.toUploadFile) {
      $scope.uploading = true;

      var post_data = {};
      if ($scope.newSlider){
        if ($scope.newSlider.text) {
          post_data.text = $scope.newSlider.text;
        }
        if ($scope.newSlider.link) {
          post_data.link = $scope.newSlider.link;
        }
      }

      post_data.file = $scope.toUploadFile
      if ($scope.forMobileFile)
        post_data.mfile = $scope.forMobileFile;

      $upload.upload({
        url: '/admin/slider',
        method: 'POST',
        data: post_data
      }).then(
        function (e) {
          $scope.sliders = SliderService.query();
          $scope.sliders.$promise.then(function (data) {
            $scope.sliders = data;
          });
          $scope.toUploadFile = null;
          $scope.uploading = false;
        },
        function (e) {
          $scope.uploading = false;
          $.Alert(e.data);
        },
        function (e) {
          var progress = parseInt(100.0 * e.loaded / e.total);
          if (progress < 100)
          $.Notify({ content: 'Uploading (' + progress + '%)' });
        }
      );
    } else {
      $.Notify({ content: 'Please upload a file.' });
    }
  }

  $scope.updateSliderImg = null;
  $scope.changeSliderImg = function (slider) {
    if (!$scope.uploading) {
      $scope.updateSliderImg = slider;
    }
  }

  $scope.chkChangeImg = function (id) {
    if ($scope.updateSliderImg && $scope.updateSliderImg._id == id) {
      return true;
    }
    return false;
  }

  $scope.cancelChangeImg = function () {
    $scope.updateSliderImg = null;
  }

  $scope.updateSlider = function () {
    if ($scope.toUploadFile ||
       ($scope.updateSliderImg && $scope.updateSliderImg.text)) {
      $scope.uploading = true;

      var post_data = { 'text' : $scope.updateSliderImg.text, 'link': $scope.updateSliderImg.link };

      post_data.file = $scope.toUploadFile
      if ($scope.forMobileFile)
        post_data.mfile = $scope.forMobileFile;

      $upload.upload({
        url: '/admin/slider/' + $scope.updateSliderImg._id,
        method: 'PUT',
        data: post_data,
      }).then(
        function (e) {
          $scope.sliders = SliderService.query();
          $scope.sliders.$promise.then(function (data) {
            $scope.sliders = data;
          });
          $scope.updateSliderImg = null;
          $scope.uploading = false;
        },
        function (e) {
          $scope.uploading = false;
          $.Alert(e.data);
        },
        function (e) {
          var progress = parseInt(100.0 * e.loaded / e.total);
          if (progress < 100)
          $.Notify({ content: 'Uploading (' + progress + '%)' });
        }
      );
    }
  }

  $scope.removeSlider = function (slider) {
    SliderService.delete({ sliderId: slider._id }, function () {
      $scope.sliders = SliderService.query();
      $scope.sliders.$promise.then(function (data) {
        $scope.sliders = data;
      });
    });
  }

});

ctrls.controller('AnalyticsCtrl', function ($scope) {

  /* Analytics demo using Chart.js */

  // Global Defaults
  Chart.defaults.global.responsive = true;

  // Line Chart
  var salesData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'First dataset',
        fillColor: 'rgba(203,200,199,0.2)',
        strokeColor: 'rgba(203,200,199,1)',
        pointColor: 'rgba(203,200,199,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(220,220,220,1)',
        data: [65, 59, 80, 81, 56, 55, 40]
      },
      {
        label: 'Second dataset',
        fillColor: 'rgba(255,143,28,0.2)',
        strokeColor: 'rgba(255,143,28,1)',
        pointColor: 'rgba(255,143,28,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(151,187,205,1)',
        data: [28, 48, 40, 19, 86, 27, 90]
      }
    ]
  };

  var sales = angular.element('#sales')[0].getContext('2d');

  var salesChart = new Chart(sales).Line(salesData);


  // Dougnut Chart
  var posData = [
    {
      value: 266,
      color:'#ff8f1c',
      highlight: 'rgba(255,143,28,0.7)',
      label: 'In-Store'
    },
    {
      value: 42,
      color: '#cbc8c7',
      highlight: 'rgba(203,200,199,0.7)',
      label: 'Mail-Order'
    },
    {
      value: 144,
      color: '#666',
      highlight: 'rgba(102,102,102,0.7)',
      label: 'Website'
    }
  ];

  var pos = angular.element('#pos')[0].getContext('2d');

  var posChart = new Chart(pos).Doughnut(posData);


  // Bar Chart
  var signupData = {
    labels: ['1 Pax', '5 Pax', '10 Pax', '15 Pax', '20 Pax', '30 Pax'],
    datasets: [
      {
        label: 'Second dataset',
        fillColor: 'rgba(203,200,199,0.2)',
        strokeColor: 'rgba(203,200,199,0.7)',
        highlightFill: 'rgba(203,200,199,0.4)',
        highlightStroke: 'rgba(203,200,199,8)',
        data: [60, 42, 76, 68, 40, 40]
      },
      {
        label: 'First dataset',
        fillColor: 'rgba(255,143,28,0.2)',
        strokeColor: 'rgba(255,143,28,0.7)',
        highlightFill: 'rgba(255,143,28,0.4)',
        highlightStroke: 'rgba(255,143,28,8)',
        data: [65, 59, 70, 67, 56, 10]
      }
    ]
  };

  var signup = angular.element('#package')[0].getContext('2d');

  var signupChart = new Chart(signup).Bar(signupData, { barValueSpacing: 10 });

});

ctrls.controller('InstructorCtrl', function ($scope, $upload, $timeout, InstructorService) {

  $scope.showAddInstructor = function () {
    $timeout(function () {
      $('.itunes-search#ins-add-albums')[0].selectize.setValue(null);
    }, 500);
    angular.element('#add-instructor-modal').Modal();
  }

  $('#ins-add-albums')[0].selectize.destroy();
  $('#ins-add-albums').selectize({
    placeholder: 'Search albums on iTunes',
    labelField: 'collectionName',
    valueField: 'collectionId',
    searchField: 'collectionName',
    maxItems: 6,
    load: function(query, callback) {
      if (!query.length) return callback();

      var term = encodeURIComponent(query);
      $.getJSON('https://itunes.apple.com/search?term=' + term + '&limit=10&attribute=albumTerm&entity=album&callback=?', function(data) {
        callback(data.results);
      });
    },
    render: {
      option: function(item, escape) {
        return '<div>' +
          '<img src="' + item.artworkUrl60 + '" />' +
          '<div>' + item.collectionName + '</div>' +
        '</div>';
      }
    }
  });

  $('#ins-album-update')[0].selectize.destroy();
  $('#ins-album-update').selectize({
    placeholder: 'Search albums on iTunes',
    labelField: 'collectionName',
    valueField: 'collectionId',
    searchField: 'collectionName',
    maxItems: 6,
    preload: true,
    options: [],
    load: function(query, callback) {
      if (!query.length) return callback();

      var term = encodeURIComponent(query);
      $.getJSON('https://itunes.apple.com/search?term=' + term + '&limit=10&attribute=albumTerm&entity=album&callback=?', function(data) {
        callback(data.results);
      });
    },
    render: {
      option: function(item, escape) {
        return '<div>' +
          '<img src="' + item.artworkUrl60 + '" />' +
          '<div>' + item.collectionName + '</div>' +
        '</div>';
      }
    },
    onChange: function (value) {
      if (value && value.length) {
        $scope.$apply(function () {
          $scope.updateInstructor.albums.push(value);
        });
      }
    }
  });

  $scope.instructors = InstructorService.query({ deactivated: true });
  $scope.instructors.$promise.then(function (data) {
    $scope.instructors = data;
  });

  $scope.addInstructor = function () {

    angular.element('#add-instructor-modal').Modal();

    if ($scope.newInstructor) {

      if (!$scope.newInstructor.first_name) {
        $.Alert('Instructor must have first name')
        return;
      }

      if (!$scope.newInstructor.last_name) {
        $.Alert('Instructor must have last name')
        return;
      }

      if (!$scope.newInstructor.email) {
        $.Alert('Instructor must have email')
        return;
      }

      if (!$scope.newInstructor.contact_number) {
        $.Alert('Instructor must have number of contact_number')
        return;
      }

      if (!$scope.newInstructor.gender)
        $scope.newInstructor.gender = 'male';



      var addSuccess = function (data) {
        $scope.picInstructor = data;
        $scope.uploadInsPic($scope.files);

        InstructorService.query({ deactivated: true }).$promise.then(function (data) {
          $scope.instructors = data;
        });
        $scope.newInstructor = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      InstructorService.create($scope.newInstructor).$promise.then(addSuccess, addFail);
    }
  }

  $scope.picInstructor = null;
  $scope.changeInsPic = function (ins) {
    if (!$scope.uploading) {
      $scope.picInstructor = ins;
    }
  }

  $scope.chkChangePic = function (id) {
    if ($scope.picInstructor && $scope.picInstructor._id == id) {
      return true;
    }
    return false;
  }

  $scope.cancelChangePic = function () {
    $scope.picInstructor = null;
  }

  $scope.uploading = false;
  $scope.uploadInsPic = function (files) {

    if (!$scope.picInstructor) {
      $scope.files = files;
      return;
    }

    if (files && files[0]) {
      var file = files[0];
      if (['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.type) < 0) {
        $.Alert('Invalid file type');
        return;
      } else if (file.size > (1024 * 1024 * 3)) {
        $.Alert('Must not exceed 3MB');
        return;
      }

      $scope.uploading = true;
      $upload.upload({
        url: '/upload/instructor',
        method: 'POST',
        data: { 'id' :$scope.picInstructor._id },
        file: file
      }).then(
        function (e) {
          $scope.instructors = InstructorService.query({ deactivated: true });
          $scope.instructors.$promise.then(function (data) {
            $scope.instructors = data;
          });
          $scope.picInstructor = null;
          $scope.uploading = false;
       },
        function (e) {
          $scope.uploading = false;
          $.Alert(e.data);
        },
        function (e) {
          $scope.progress = parseInt(100.0 * e.loaded / e.total);
        }
      );
    } else {
      $.Alert('Please select image to upload');
    }
  }

  $scope.setToUpdate = function (ins) {
    $scope.isUpdateInstructor = true;
    $scope.updateInstructor = ins.admin;
    $scope.updateInstructor._id = ins._id;
    $scope.updateInstructor.gender = ins.gender;
    $scope.updateInstructor.motto = ins.motto;

    if (ins.albums) {
        delete ins.albums.$$hashKey;
    }
    $scope.updateInstructor.albums = ins.albums;

    if (ins.birthdate) {
      $scope.updateInstructor.birthdate = ins.birthdate.replace(' 00:00:00', '');
    } else {
      $scope.updateInstructor.birthdate = '';
    }

    $timeout(function () {
      $('#ins-album-update')[0].selectize.setValue(null);
      $.getJSON('https://itunes.apple.com/lookup?id=' + ins.albums.join(',') + '&attribute=albumTerm&entity=album&callback=?', function(data) {
        $('#ins-album-update')[0].selectize.addOption(data.results);
        $timeout(function () {
          $('#ins-album-update')[0].selectize.setValue(ins.albums);
        }, 500);
      });
    });
  }

  $scope.cancelUpdateInstructor = function () {
    $scope.isUpdateInstructor = false;
    $scope.updateInstructor = null;
  }

  $scope.setInstructor = function () {
    if ($scope.updateInstructor) {
      var addSuccess = function () {
        InstructorService.query({ deactivated: true }).$promise.then(function (data) {
          $scope.instructors = data;
        });
        $scope.isUpdateInstructor = false;
        $scope.updateInstructor = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      InstructorService.update({ instructorId: $scope.updateInstructor._id }, $scope.updateInstructor).$promise.then(addSuccess, addFail);
    }
  }

  $scope.removeInstructor = function (ins) {
    $.Confirm('Are you sure on deleting ' + ins.admin.first_name + ' ' + ins.admin.last_name + ' ?', function () {
      var addSuccess = function (data) {
        InstructorService.query({ deactivated: true }).$promise.then(function (data) {
          $scope.instructors = data;
        });
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      InstructorService.delete({instructorId : ins._id}).$promise.then(addSuccess, addFail);
    });
  }

  $scope.activateInstructor = function (ins) {
    $.Confirm('Are you sure to activate instructor ' + ins.admin.first_name + ' ' + ins.admin.last_name + ' ?', function () {
      var instructor = ins.admin;
      instructor._id = ins._id;
      instructor.gender = ins.gender;
      instructor.motto = ins.motto;
      instructor.birthdate = ins.birthdate ? ins.birthdate.replace(' 00:00:00', ''):'';
      instructor.deactivated = false;
      var addSuccess = function () {
        ins.deactivated = false;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      InstructorService.update({ instructorId: instructor._id }, instructor).$promise.then(addSuccess, addFail);
    });
  }

});

ctrls.controller('GiftCardCtrl', function ($scope, $route, $location, TransactionService, PackageService, GiftCardService, UserService) {

  var qstring = $location.search();


  if (qstring.s == 'error') {
    $.Alert('Transaction failed');
    $location.search('s', null);
    $location.search('msg', null);
  }else{
    if (qstring.msg){
      $.Alert(qstring.msg);
      $location.search('s', null);
      $location.search('msg', null);
    }
  }

  $scope.currentPage = 0;
  $scope.hasNext = true;
  var isRedeemed = ($location.url() == '/gc-redemption');


  var from_input = angular.element('#input_from').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), from_picker = from_input.pickadate('picker')

  var to_input = angular.element('#input_to').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), to_picker = to_input.pickadate('picker')


  var date = new Date();
  from_picker.set('select', new Date());
  to_picker.set('select', [date.getFullYear(), date.getMonth(), date.getDate() + 7]);

  $scope.gcDateFilter = {};
  $scope.gcDateFilter.fromDate = from_picker.get('value');
  $scope.gcDateFilter.toDate = to_picker.get('value');

  // Check if there’s a “from” or “to” date to start with.
  if (from_picker.get('value')) {
    to_picker.set('min', from_picker.get('select'));
  }
  if (to_picker.get('value')) {
    from_picker.set('max', to_picker.get('select'));
  }

  // When something is selected, update the “from” and “to” limits.
  from_picker.on('set', function (event) {
    if (event.select) {
      to_picker.set('min', from_picker.get('select'));
    }
    else if ('clear' in event) {
      to_picker.set('min', false);
    }
  });

  to_picker.on('set', function (event) {
    if (event.select) {
      from_picker.set('max', to_picker.get('select'));
    }
    else if ('clear' in event) {
      from_picker.set('max', false);
    }
  });

  $scope.$watchCollection('[gcDateFilter.fromDate, gcDateFilter.toDate]', function (newValues, oldValues) {
      if (newValues[0] && newValues[1]) {
          $scope.transactions = GiftCardService.query({ fromDate:newValues[0], toDate:newValues[1], isRedeemed:isRedeemed });
          $scope.transactions.$promise.then(function (data) {
            $scope.transactions = data;
          });
      } else {
        $scope.transactions = GiftCardService.query({ isRedeemed:isRedeemed });

        $scope.transactions.$promise.then(function (data) {
      
          $scope.transactions = data;
        });
      }
  });




  $scope.exportGCListByDate = function () {
    if ($scope.gcDateFilter) {
      var fromDate = $scope.gcDateFilter.fromDate;
      var toDate = $scope.gcDateFilter.toDate;

      $scope.transactions = GiftCardService.query({ fromDate:fromDate, toDate:toDate, isRedeemed:isRedeemed });
      $scope.transactions.$promise.then(function (data) {
        $scope.transactions = data;
        if ($scope.transactions.length) { 
          window.location = '/admin/export/download-gift-cards-report?fromDate=' + fromDate + '&toDate=' + toDate + '&isRedeemed=' + isRedeemed;
        } else {
          $.Alert('No Data Found.');
        }
      });

    
    } else {
      $.Alert('Please select a valid date values');
    }
  }



  $scope.searchGC = function(queryString){
      var fromDate = $scope.gcDateFilter.fromDate;
      var toDate = $scope.gcDateFilter.toDate;

      $scope.transactions = GiftCardService.query({ fromDate:fromDate, toDate:toDate, isRedeemed:isRedeemed, queryString:queryString });
      $scope.transactions.$promise.then(function (data) {
        $scope.transactions = data;
      });
  }

  UserService.query({ deactivated: true, get_all:true}, function (accounts) {
    $scope.accounts = accounts;
    var select = angular.element('#gc-account-selector')[0].selectize;
    select.settings.searchField = ['text', 'email'];
    angular.forEach(accounts, function (account) {
      if (account) select.addOption({ value: account._id,
                                      text: account.first_name+ ' ' + account.last_name + ' ' + account.email,
                                      email: account.email });
    });
  });

  PackageService.query(function (packages) {
    var select = angular.element('.gc-package-selector')[0].selectize;

    var select2 = angular.element('.gc-package-selector2')[0].selectize;
    angular.forEach(packages, function (pack) {
      if (pack){
        select.addOption({ value: JSON.stringify(pack), text: pack.name });
        select2.addOption({ value: JSON.stringify(pack), text: pack.name });
      }
    });
  });

  $scope.getTransId = function (pac) {
    if (pac.trans_info) {
      if (!(pac.trans_info instanceof Object)) {
        try {
          var transInfo = pac.trans_info.replace(/\"/g, '');
          var transInfo = transInfo.replace(/'/g, '"');
          var trans = JSON.parse(transInfo);
          pac.trans_info = trans;
          return trans.transaction;
        } catch (e) {
          if (pac.pptx) return pac.pptx;
          else return 'Err: Transaction ID';
        }
      } else {
        return pac.trans_info.transaction;
      }
    } else if (pac.pptx) {
      return pac.pptx;
    }

    return 'Err: Transaction ID';
  }

    $scope.prevPage = function (event) {
      var fromDate = $scope.gcDateFilter.fromDate;
      var toDate = $scope.gcDateFilter.toDate;

      if ($scope.currentPage > 0) {
        $scope.currentPage -=1;
      }
        $scope.transactions = GiftCardService.query({ page : $scope.currentPage, fromDate:fromDate, toDate:toDate, isRedeemed:isRedeemed });
        $scope.transactions.$promise.then(function (data) {
          $scope.transactions = data;
        });

      event.preventDefault();
    }

    $scope.nextPage = function (event) {
      var fromDate = $scope.gcDateFilter.fromDate;
      var toDate = $scope.gcDateFilter.toDate;

      $scope.transactions = GiftCardService.query({ page : $scope.currentPage+1, fromDate:fromDate, toDate:toDate, isRedeemed:isRedeemed });
      $scope.transactions.$promise.then(function (data) {
        if(data.length >= 10){
          $scope.transactions = data;
          $scope.currentPage += 1;
        }
      });
      event.preventDefault();
    }

  $scope.showRedeemGCForm = function () {
    angular.element('#redeem-gc-modal').Modal();
  }

  $scope.generateGCForm = function(){
    angular.element('#generate-gc-modal').Modal();
  }

  $scope.showBuyGCForm = function () {
    angular.element('#buy-gc-modal').Modal();
  }

  $scope.selectGCPackage = function(){

    var jsonPackage = JSON.parse($scope.gcPackage);
    $('input#item_name').val(jsonPackage.name);
    $('input#item_number').val(jsonPackage._id);
    $('input#amount').val(jsonPackage.fee);
    $scope.gcAmount = jsonPackage.fee;
  }


  $scope.generateGC = function(){

    if ($scope.gcCount && $scope.gcPackage){
      var jsonPackage = JSON.parse($scope.gcPackage);
      var data = {
        count : $scope.gcCount,
        package_id : jsonPackage._id,
        user_id : $scope.gcAccount
      }

      var batchSuccess = function () {
        $route.reload();
        $.Alert('Success')
      }

      var batchFail = function (error) {
        $.Alert(error.data);
      }

      GiftCardService.create(data).$promise.then(batchSuccess, batchFail);

    }else{
      $.Alert('Complete your form');
    }
  }
  $scope.redeemGC = function(){
    $scope.redeemingGC = true;
    if ( $scope.gcCode && $scope.gcPin && $scope.gcAccount){
      var data = {
        code : $scope.gcCode,
        pin : $scope.gcPin,
        user_id : $scope.gcAccount
      }

      var redeemSuccess = function () {
        $route.reload();
        $.Alert('Success')
        $scope.redeemingGC = false;
      }

      var redeemFail = function (error) {
        $.Alert(error.data);
        $scope.redeemingGC = false;
      }
      GiftCardService.redeem({ gcCode: $scope.gcCode }, data ).$promise.then(redeemSuccess, redeemFail);
    }else{
      $.Alert('Complete your form')
    }
  }

  var port = '';
  if (window.location.port)
    port = ':' + window.location.port;
  $scope.redirectUrl = window.location.protocol + '//' + window.location.hostname + port;

  $scope.buyGC = function(arg){

    if(arg == 'confirm_buy'){

      if ($scope.receiverEmail){
        $.Confirm('Reminder: After payment is completed, kindly wait for PayPal to redirect back to www.electricstudio.ph.', function () {

            if ($scope.gcMessage == undefined){
              $scope.gcMessage = ""
            }

            var jsonPackage = JSON.parse($scope.gcPackage);
            var ipn_notification_url = $scope.redirectUrl + "/admin/ipn_gc?pid=" + jsonPackage._id +
                                        "&success=True&email=" + $scope.receiverEmail + "&message=" + $scope.gcMessage +
                                        "&senderIsReceiver="+ $scope.senderIsReceiver + "&sender_name="+$scope.gcFrom + "&receiver_name=" + $scope.gcTo+"&admin=True";
            var return_url = $scope.redirectUrl + "/admin/buy_gc?pid=" + jsonPackage._id + "&success=True&email=" + $scope.receiverEmail +
                          "&message=" + $scope.gcMessage +"&senderIsReceiver="+ $scope.senderIsReceiver+ "&sender_name="+$scope.gcFrom + "&receiver_name=" + $scope.gcTo +"&admin=True";
            var cancel_return_url = $scope.redirectUrl + "/admin/buy_gc?success=False&admin=True";

            $('input#ipn_notification_url').val(ipn_notification_url);
            $('input#return').val(return_url);
            $('input#cancel_return').val(cancel_return);

            angular.element('#payForm').submit();
        });
      }else{
       $.Alert('Please enter valid recipient email.');
      }
    }else{
      if ($scope.gcTo && $scope.gcFrom && $scope.gcPackage){

        if (arg == 'sender') {
          $scope.senderIsReceiver = true
        }else{
          $scope.senderIsReceiver = false
        }

        angular.element('#enter-email-modal').Modal();
      }else{
        $.Alert('Complete your form');
      }
    }

  }

});

ctrls.controller('TransactionsCtrl', function ($scope, TransactionService, PackageService) {

  $scope.currentPage = 0;
  $scope.hasNext = true;
  $scope.transactions = TransactionService.query();
  $scope.transactions.$promise.then(function (data) {
    $scope.transactions = data;
  });

  PackageService.query(function (packages) {
    var select = angular.element('#search-trans-package')[0].selectize;

    angular.forEach(packages, function (pack) {
      if (pack) select.addOption({ value: pack._id, text: pack.name });
    });
  });

  $scope.getTransId = function (pac) {
    if (pac.trans_info) {
      if (!(pac.trans_info instanceof Object)) {
        try {
          var transInfo = pac.trans_info.replace(/\"/g, '');
          var transInfo = transInfo.replace(/'/g, '"');
          var trans = JSON.parse(transInfo);
          pac.trans_info = trans;
          return trans.transaction;
        } catch (e) {
          if (pac.trans_id) {
            return pac.trans_id;
          } else {
            return 'Err: Transaction ID';
          }
        }
      } else {
        return pac.trans_info.transaction;
      }
    } else if (pac.trans_id) {
      return pac.trans_id;
    }

    return 'Err: Transaction ID';
  }

    $scope.prevPage = function (event) {
      if ($scope.currentPage > 0) {
        $scope.currentPage -=1;
        $scope.transactions = TransactionService.query({ page : $scope.currentPage });
        $scope.transactions.$promise.then(function (data) {
          $scope.transactions = data;
        });
      }
      event.preventDefault();
    }

    $scope.nextPage = function (event) {
      $scope.transactions = TransactionService.query({ page : $scope.currentPage+1 });
      $scope.transactions.$promise.then(function (data) {
        if(data.length > 0){
          $scope.transactions = data;
          $scope.currentPage += 1;
        }
      });
      event.preventDefault();
    }
});

ctrls.controller('StatisticCtrl', function ($scope, StatisticService, InstructorService, SettingService, BranchService) {

  $scope.resetTotals = function () {
    $scope.totalSeats = 0;
    $scope.totalReserved = 0;
    $scope.stats = angular.copy($scope.stats);
  }

  $scope.setTotal = function (stat, index) {
    if (!index) {
      $scope.totalSeats = 0;
      $scope.totalReserved = 0;
    }
    $scope.totalSeats += stat.seats - $scope.blockedBikes.length;
    $scope.totalReserved += stat.books.length;
  }

  $scope.stats = StatisticService.query();
  $scope.stats.$promise.then(function (data) {
    $scope.stats = data;
  });

  SettingService.getBlockedBikes(function (bikes) {
    $scope.blockedBikes = bikes;
    var count = 0;
    for (var key in bikes){
      if(parseInt(key)){
        count++
      }
    }
    $scope.blockedBikes.length = count;
  });

  var from_input = angular.element('#input_from').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), from_picker = from_input.pickadate('picker')

  var to_input = angular.element('#input_to').pickadate({
      format: 'yyyy-mm-dd',
      formatSubmit: 'yyyy-mm-dd',
      today: false
    }), to_picker = to_input.pickadate('picker')


  var date = new Date();
  from_picker.set('select', new Date());
  to_picker.set('select', [date.getFullYear(), date.getMonth(), date.getDate() + 7]);

  $scope.statFilter = {};
  $scope.statFilter.fromDate = from_picker.get('value');
  $scope.statFilter.toDate = to_picker.get('value');

  // Check if there’s a “from” or “to” date to start with.
  if (from_picker.get('value')) {
    to_picker.set('min', from_picker.get('select'));
  }
  if (to_picker.get('value')) {
    from_picker.set('max', to_picker.get('select'));
  }

  // When something is selected, update the “from” and “to” limits.
  from_picker.on('set', function (event) {
    if (event.select) {
      to_picker.set('min', from_picker.get('select'));
    }
    else if ('clear' in event) {
      to_picker.set('min', false);
    }
  });
  to_picker.on('set', function (event) {
    if (event.select) {
      from_picker.set('max', to_picker.get('select'));
    }
    else if ('clear' in event) {
      from_picker.set('max', false);
    }
  });

  $scope.isCompleted = function (sched) {

    var now = new Date();
    var dateParts = sched.date.split(/[^0-9]/);
    var timeParts = sched.start.split(/[^0-9]/);
    var date =  new Date(dateParts[0], dateParts[1]-1, dateParts[2], timeParts[3], timeParts[4], timeParts[5]);
    if (date < now)
      return true;

    return false

  }


  $scope.filterDate = function () {
    if ($scope.statFilter) {
      var fromDate = $scope.statFilter.fromDate;
      var toDate = $scope.statFilter.toDate;
      $scope.stats = StatisticService.query({ fromDate:fromDate, toDate:toDate });
      $scope.stats.$promise.then(function (data) {
        $scope.stats = data;
      });
    } else {
      $.Alert('Please select a valid date values');
    }
  }

  $scope.isBlocked = function (seat) {
    if ($scope.blockedBikes && $scope.blockedBikes[seat]) {
      return true;
    }
    return false;
  }

  $scope.checkSeat = function (seat) {

    if ($scope.selectedStat && $scope.selectedStat.books) {
      for (var b in $scope.selectedStat.books) {
        if ($scope.selectedStat.books[b].seat_number == seat ||
            seat > $scope.selectedStat.seats) {
          return true;
        }
      }
    }

    return false;
  }

  $scope.viewBikeMap = function (stat) {
    $scope.selectedStat = stat;
    SettingService.getBlockedBikes(function (bikes) {
      $scope.blockedBikes = bikes;
      var count = 0;
      for (var key in bikes){
        if(parseInt(key)){
          count++
        }
      }
      $scope.blockedBikes.length = count;
    });

    angular.element('#bike-map-modal').Modal();
  }

  $scope.viewUserList = function (stat, sType) {
    $scope.selectedStat = stat;
    $scope.selectedType = sType;
    angular.element('#list-users-modal').Modal();
  }

  BranchService.query(function (branches) {
    var bselectize = angular.element('#select-branch')[0].selectize;
    bselectize.addOption({ value: '', text: 'All' });
    angular.forEach(branches, function (b) {
      if (b) bselectize.addOption({ value: b._id, text: b.name });
    });
  });

  InstructorService.query(function (instructors) {
    var select = angular.element('#search-instructor')[0].selectize;
    select.addOption({ value: '', text: 'All' });
    angular.forEach(instructors, function (ins) {
      if (ins) select.addOption({ value: ins._id, text: ins.admin.first_name + ' ' + ins.admin.last_name });
    });
  });

  $scope.withAvailableSeats = function (stat) {
    if ($scope.selectedOption && $scope.selectedOption != 'all') {
      if ($scope.selectedOption == 'withAvailable') {
        return stat.books.length < stat.seats;
      } else if ($scope.selectedOption == 'withWaitlisted') {
        return stat.waitlist.length > 0;
      }
    }

    return true;
  }

});


ctrls.controller('BranchCtrl', function ($scope, BranchService) {

  var reloadBranches = function () {
    BranchService.query().$promise.then(function (data) {
      $scope.branches = data;
    });
  }

  reloadBranches();
});

ctrls.controller('SettingCtrl', function ($scope, $timeout, $filter, SettingService) {

  var strTimeToDate = function (strTime) {
    if (strTime) {

      var timeSplit = strTime.split(' ');
      var time = timeSplit[0].split(':');
      var ampm = timeSplit[1];

      if(ampm.toLowerCase() == 'pm'){
        if (parseInt(time[0]) < 12) {
          time[0] = (parseInt(time[0]) + 12) + '';
        }
      }

      var date = new Date();
      date.setHours(parseInt(time[0]), parseInt(time[1]), 0);
      return date;
    }
  }

  SettingService.get({ key: 'week_release' }, function (data) {
    if (data) {

      var time_split = null;
      if (data.time) {
        var date = new Date()
        time_split = data.time.split(':')
        date.setHours(time_split[0], time_split[1], 0 , 0);
        data.time = date;
      }
      $scope.weekRelease = {}
      $scope.weekRelease.time = data.time;

      $timeout(function () {
        if (time_split && $('[type="time"]').prop('type') != 'time' ) {
          var dateTime = data.time.getFullYear() + '-' + (data.time.getMonth()+1) + '-' + data.time.getDate() + ' ';
          dateTime += data.time.getHours() + ':' + data.time.getMinutes() + ':' + data.time.getSeconds();
          angular.element('#week-release-time').val($filter('formatTime')(dateTime));
        }
        angular.element('#week-release-day')[0].selectize.setValue(data.day)
      }, 400);

    }
  });

  if ( $('[type="time"]').prop('type') != 'time' ) {
    $('[type="time"]').pickatime({
      formatSubmit: 'HH:i',
      hiddenName: true,
      min: [5, 0]
    });
  }

  $scope.setWeekRelease = function () {


    if ( $('[type="time"]').prop('type') != 'time' ) {
      $scope.weekRelease.time = strTimeToDate(angular.element('#week-release-time').val());
    }

    if ($scope.weekRelease && $scope.weekRelease.day && $scope.weekRelease.time) {
      var wr = angular.copy($scope.weekRelease);
      wr.time = wr.time.getHours() + ':' + wr.time.getMinutes();
      SettingService.update({ key: 'week_release' }, wr,  function () {
        if ($('[type="time"]').prop('type') != 'time' ) {
          var dtime = $scope.weekRelease.time;
          var dateTime = dtime.getFullYear() + '-' + (dtime.getMonth()+1) + '-' + dtime.getDate() + ' ';
          dateTime += dtime.getHours() + ':' + dtime.getMinutes() + ':' + dtime.getSeconds();
          angular.element('#week-release-time').val($filter('formatTime')(dateTime));
        }
        $.Alert('Successfully update schedule week release settings');
      }, function (error) { $.Alert(error.data); });
    } else {
      $.Alert('Please provide date and time for week release settings');
    }
  }

  var selectBlock = angular.element('#select-blocked-bikes')[0].selectize;
  $scope.blockedBikes = {};
  var reloadBlockBikes = function () {
    SettingService.getBlockedBikes(function (bikes) {
      $scope.blockedBikes = bikes;
      selectBlock.settings.sortField = 'text';
      selectBlock.clearOptions();
      for (var x = 37; x > 0; x--) {
        if (!bikes[x])
          selectBlock.addOption({ value: x, text: x });
      }
    });
  }
  reloadBlockBikes();

  for (var x = 37; x > 0; x--) {
    selectBlock.addOption({ value: x, text: x });
  }

  $scope.blockedBike = function () {
    if ($scope.newBlock) {
      if (!$scope.newBlock.bike || $scope.newBlock.bike.length == 0) {
        $.Alert('Please select bike to blocked')
        return;
      }
      if (!$scope.newBlock.reason || $scope.newBlock.reason.length == 0) {
        $.Alert('Please provide a reason on blocking the bike')
        return;
      }

      SettingService.update({ key: 'blocked_bikes' }, $scope.newBlock, function (bike) {
        if (bike && bike.error && bike.scheds){
          $scope.bikeScheds = bike.scheds;
          angular.element('#bike-sched-modal').Modal();
        } else {
          reloadBlockBikes();
        }
        $scope.newBlock = {};
      }, function (error) { $.Alert(error.data); $scope.newBlock = {}; });
    }
  }

  $scope.unBlockedBike = function (bike) {
    $.Confirm('Are you sure on unblocking bike ' + bike + ' ?', function () {
      SettingService.delBlockedBikes({ key: 'blocked_bikes', bike: bike }, function () {
        reloadBlockBikes();
      });
    });
  }

});

ctrls.controller('LandingPageCtrl', function ($scope, $upload, LandingPageService) {

   $scope.showAddLandingPage = function () {
    angular.element('#add-landing-page-modal').Modal();
  }

  $scope.landingPages = LandingPageService.query();
  $scope.landingPages.$promise.then(function (data) {
    $scope.landingPages = data;
  });

  $scope.addLandingPage = function () {

    angular.element('#add-landing-page-modal').Modal();

    if ($scope.newLandingPage) {
      if (!$scope.newLandingPage.text) {
        $.Alert('LandingPage must have text');
        return;
      }

      if (!$scope.newLandingPage.button_label) {
        $.Alert('LandingPage must have button label');
        return;
      }

      if (!$scope.newLandingPage.button_link) {
        $.Alert('LandingPage must have button link')
        return;
      }

      var addSuccess = function (data) {
        $scope.picLandingPage = data;
        $scope.uploadLandingPic($scope.files);

        LandingPageService.query().$promise.then(function (data) {
          $scope.landingPages = data;
        });
        $scope.newLandingPage = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      LandingPageService.create($scope.newLandingPage).$promise.then(addSuccess, addFail);
    }
  }

  $scope.picLandingPage = null;
  $scope.changeLandingPic = function (ins) {
    if (!$scope.uploading) {
      $scope.picLandingPage = ins;
    }
  }

  $scope.chkChangePic = function (id) {
    if ($scope.picLandingPage && $scope.picLandingPage._id == id) {
      return true;
    }
    return false;
  }

  $scope.cancelChangePic = function () {
    $scope.picLandingPage = null;
  }

  $scope.uploading = false;
  $scope.uploadLandingPic = function (files) {

    if (!$scope.picLandingPage) {
      $scope.files = files;
      return;
    }

    if (files && files[0]) {
      var file = files[0];
      if (['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.type) < 0) {
        $.Alert('Invalid file type');
        return;
      } else if (file.size > (1024 * 1024 * 3)) {
        $.Alert('Must not exceed 3MB');
        return;
      }

      $scope.uploading = true;
      $upload.upload({
        url: '/upload/landing',
        method: 'POST',
        data: { 'id' :$scope.picLandingPage._id },
        file: file
      }).then(
        function (e) {
          $scope.landingPages = LandingPageService.query();
          $scope.landingPages.$promise.then(function (data) {
            $scope.landingPages = data;
          });
          $scope.picLandingPage = null;
          $scope.uploading = false;
       },
        function (e) {
          $scope.uploading = false;
          $.Alert(e.data);
        },
        function (e) {
          $scope.progress = parseInt(100.0 * e.loaded / e.total);
        }
      );
    } else {
      $.Alert('Please select image to upload');
    }
  }

  $scope.setToUpdate = function (ins) {
    $scope.isUpdateLandingPage = true;
    $scope.updateLandingPage = ins;
  }

  $scope.cancelUpdateLandingPage = function () {
    $scope.isUpdateLandingPage = false;
    $scope.updateLandingPage = null;
  }

  $scope.setLandingPage = function () {
    if ($scope.updateLandingPage) {
      var addSuccess = function () {
        LandingPageService.query().$promise.then(function (data) {
          $scope.landingPages = data;
        });
        $scope.isUpdateLandingPage = false;
        $scope.updateLandingPage = null;
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      LandingPageService.update({ landingPageId: $scope.updateLandingPage._id }, $scope.updateLandingPage).$promise.then(addSuccess, addFail);
    }
  }

  $scope.removeLandingPage = function (ins) {
    $.Confirm('Are you sure on deleting ' + ins.text + ' ?', function () {
      var addSuccess = function (data) {
        LandingPageService.query().$promise.then(function (data) {
          $scope.landingPages = data;
        });
      }

      var addFail = function (error) {
        $.Alert(error.data);
      }

      LandingPageService.delete({ landingPageId : ins._id}).$promise.then(addSuccess, addFail);
    });
  }

});
