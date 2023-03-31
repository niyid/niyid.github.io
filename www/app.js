var config = {
	apiKey: "AIzaSyC_aG9gh6Lm3VY1Ce9wnUcRbkiMO4gYyPY",
	authDomain: "scrowit.firebaseapp.com",
	projectId: "scrowit",
	storageBucket: "scrowit.appspot.com",
	messagingSenderId: "878425882680",
	appId: "1:878425882680:web:f6bc895f39ee09afbfa6cd",
};
firebase.initializeApp(config);

const app = angular.module("ScrowIt", ["firebase", "ngRoute", "ngAnimate", "ngSanitize", "ngTouch", "angular.filter", "angular-loading-bar", "monospaced.elastic"]);

app.factory('$exceptionHandler', function() {
  return function(exception, cause) {
    console.error(exception + " caused by => " + cause);
    // add any custom error handling code here
  };
});

emailjs.init('VqN9NkXpRRL79Guml');
  
// Define the 'myController' controller
app.controller('ScrowItController', function($scope, $http) {
  // Initialize Firestore Database
  const db = firebase.firestore();

  // Initialize Firebase Authentication
  const auth = firebase.auth();
  
	$scope.appTitle = "ScrowIt!"
  $scope.addEscrowButtonVisible = false;
  $scope.logoutButtonVisible = false;
  $scope.loginButtonVisible = true;
  $scope.registerButtonVisible = true;
  $scope.loginFormDivVisible = true;
  $scope.registerFormDivVisible = true;

  $scope.isLoggedIn = function() {
    return $scope.user != null;
  };
    
  // Function to update the UI based on the user's login state
  function updateUI(user) {
  	console.log("updateUI()");
    if (user) {
      $scope.user = user;
      $scope.addEscrowButtonVisible = true;
      $scope.logoutButtonVisible = true;
      $scope.loginButtonVisible = false;
      $scope.registerButtonVisible = false;
      $scope.escrowItemListVisible = true;
      $scope.welcomeMsgVisible = true;
      $scope.loadEscrowItems();  
    } else {
      $scope.user = null;
      $scope.addEscrowButtonVisible = false;
      $scope.logoutButtonVisible = false;
      $scope.loginButtonVisible = true;
      $scope.registerButtonVisible = true;
      $scope.escrowItemListVisible = false;
      $scope.welcomeMsgVisible = false;  
    }
  }
  
  // Add an event listener to the Firebase auth object to monitor the user's login state
  auth.onAuthStateChanged(function(user) {
  	console.log("onAuthStateChanged()");
    // Update the UI based on the user's login state
    updateUI(user);
  });

  // Load escrow items from Firestore Database
	$scope.loadEscrowItems = function() {
		console.log("loadEscrowItems()");
		var sellerQuery = db.collection('EscrowItem')
				                .where('sellerEmail', '==', $scope.user.email)
				                .get();

		var buyerQuery = db.collection('EscrowItem')
				              .where('buyerEmail', '==', $scope.user.email)
				              .get();

		Promise.all([sellerQuery, buyerQuery])
			.then(function(querySnapshotArray) {
				var combinedResults = [];

				querySnapshotArray.forEach(function(querySnapshot) {
				  querySnapshot.forEach(function(doc) {
				    combinedResults.push({ id: doc.id, data: doc.data() });
				  });
				});
				
				combinedResults.sort((a, b) => b.dateEdited - a.dateEdited);//Sort combined results by dateEdited

				$scope.escrowItems = combinedResults;
				$scope.$apply();
				 
				console.log('EscrowItems:', $scope.escrowItems);
			})
			.catch(function(error) {
				console.error('Error retrieving EscrowItems:', error);
			});
	};

	$scope.saveEscrowItem = function() {
		 $scope.error = null;
			try {
				if($scope.tradeCurrency == null) throw new Error("Trade currency must be selected");
				if($scope.user.email == $scope.buyerEmail) throw new Error("Buyer and Seller cannot be same.");
				var selCurrency =	$scope.tradeCurrency.split(",");
				console.log('Selected tradeCurrency:', $scope.tradeCurrency);
				console.log('Selected value,label:', selCurrency);
				var fee = $scope.tradeAmount * 0.05;
				console.log("Escrow data: ", $scope.description + " " + $scope.buyerEmail + " " + $scope.tradePeriod + " " + $scope.tradeAmount);
				db.collection('EscrowItem').add({
				  description: $scope.description,
				  sellerEmail: $scope.user.email,
				  sellerCellphone: $scope.sellerCellphone,
				  buyerCellphone: $scope.buyerCellphone,
				  buyerEmail: $scope.buyerEmail,
				  tradePeriod: $scope.tradePeriod,
				  tradeAmount: $scope.tradeAmount,
				  //Trade fee cap is 500 NGN. Ideally the fee is split between the seller and buyer. Maybe also charge on the side of the seller?
				  tradeFee: fee < 500 ? fee : 500,
				  tradeStatus: "PAY",
				  tradeCurrencySymbol: selCurrency[0],
				  tradeCurrency: selCurrency[1],
				  sellerBank: $scope.sellerBank,
				  sellerBankAccount: $scope.sellerBankAccount,				  
				  dateAdded: firebase.firestore.FieldValue.serverTimestamp(),
				  dateEdited: firebase.firestore.FieldValue.serverTimestamp()
				})
				.then(function(docRef) {
				  console.log("Document written with ID: ", docRef.id);
		    	$('#addEscrowFormDiv').modal('hide');
		      $scope.$apply(); 
				  $scope.itemName = '';
				  $scope.sellerEmail = '';
				  $scope.buyerEmail = '';
				  $scope.sellerCellphone = '';
				  $scope.buyerCellphone = '';
				  $scope.tradePeriod = '';
				  $scope.tradeAmount = '';
				  $scope.tradeStatus = 'PAY';
				  $scope.tradeCurrency = '';
				  $scope.sellerBank = '';
				  $scope.sellerBankAccount = '';
				  $scope.showForm = false;
				  $scope.loadEscrowItems();
				})
				.catch(function(error) {
					$scope.error = ex.message;
				  console.error("Error adding document: ", error);
				});
			} catch (ex) {
				$scope.error = ex.message;
			}	
	};

	$scope.cancelForm = function() {
		$scope.showForm = false;
	};
	
	$scope.cancelLoginForm = function() {
		$scope.showLoginForm = false;
	};
	
  $scope.addUser = function() {
    var name = $scope.userFullname;
    var email = $scope.emailRegister;
    var password = $scope.passwordRegister;
    var passwordConfirm = $scope.passwordConfirmRegister;
    console.log("Email: " + email + "; Password: " + password + "; Name: " + name);
    if(password != passwordConfirm) throw new Error("Password confirmation does not match");
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function() {
      	$('#registerFormDiv').modal('hide');
        $scope.$apply(); 
        console.log("User added successfully.");
      })
      .catch(function(error) {
        console.error("Error adding user: ", error);
      });
  };

  // Function to log out a user
  $scope.logout = function() {
    return firebase.auth().signOut()
      .then(function() {
		    $scope.loginButtonVisible = true;
		    $scope.registerButtonVisible = true;
      	$scope.addEscrowButtonVisible = false;
      	$scope.escrowItemListVisible = false; 
      	$scope.logoutButtonVisible = false;
      	$scope.welcomeMsgVisible = false; 
      	$scope.escrowItems = [];
      	$scope.$apply(); 
        console.log("User logged out successfully.");
      })
      .catch(function(error) {
        console.error("Error logging out user: ", error);
      });
  };
  
	$scope.login = function() {
    var email = $scope.emailInput;
    var password = $scope.passwordInput;
    console.log("Email: " + email + "; Password: " + password);
    return firebase.auth().signInWithEmailAndPassword(email, password)
      .then(function() {
      	$('#loginFormDiv').modal('hide');
        $scope.$apply(); 
        console.log("User logged in successfully.");
      })
      .catch(function(error) {
        console.error("Error logging in user: ", error);
      });
  };  

  // Function to deactivate a user
  $scope.deactivateUser = function(uid) {
    return firebase.auth().updateUser(uid, {
        disabled: true
      })
      .then(function() {
        // Update user data in the Firestore database
        return db.collection("users").doc(uid).update({
          isActive: false
        });
      })
      .then(function() {
        console.log("User deactivated successfully.");
      })
      .catch(function(error) {
        console.error("Error deactivating user: ", error);
      });
  };
  
  $scope.openPaymentModal = function(tradeAmount, tradeCurrency, tradeFee, sellerEmail, buyerEmail, buyerCellphone, escrowId) {
  	console.log("openPaymentModal: " + tradeAmount + " " + tradeCurrency + " " + tradeFee + " " + buyerEmail + " " + buyerCellphone + " " + escrowId);
		FlutterwaveCheckout({
			public_key: "FLWPUBK_TEST-e3365466fde4515e7599e987cc814cf0-X",
			tx_ref: "REF" + Math.floor((Math.random() * 10000000000000) + 1),
			amount: tradeAmount + tradeFee,
			currency: tradeCurrency,
			payment_options: "card, ussd, bank_transfer",
			customer: {
				email: buyerEmail,
				phone_number: buyerCellphone,
				name: buyerEmail //Use email address as name
			},
			customizations: {
				title: "ScrowIt!",
				description: "Escrow Deposit",
				logo: "img/techducat_logo.png"
			},
			onclose: function() {
				console.log("openPaymentModal:onclose");
			},
			callback: function(response) {
				//Email is sent to $seller_email to notify that the customer has paid into escrow.
				console.log("openPaymentModal:callback " + response.tx_ref);
				const docRef = db.collection('EscrowItem').doc(escrowId);
				docRef.update({
					tradeStatus: "DELIVER",
					dateEdited: firebase.firestore.FieldValue.serverTimestamp(),
					txRef: response.tx_ref
				})
				.then(() => {
					console.log('Trade status now updated to DELIVER successfully');
					docRef.get()
						.then((doc) => {
							if (doc.exists) {
								const data = doc.data();
								// Check if tradeStatus has been updated to 'DELIVER'
								if (data.tradeStatus === 'DELIVER') {
								  // Get the seller email address from the document
								  $scope.sendEmail('template_status_update', sellerEmail, buyerEmail, escrowId);
								} else {
								  console.log('Trade status not updated to DELIVER');
								}
							} else {
								console.log('No such EscrowItem document');
							}
						})
						.catch((error) => {
							console.log('Error getting EscrowItem document:', error);
						});
					$scope.loadEscrowItems();					
					$scope.$apply();
					alert("EscrowItem is now in DELIVER status.");
				})
				.catch((error) => {
					console.error('Error updating EscrowItem:', error);
				});				
			}
		});
  };
  
  $scope.sendEmail = function(templateId, sellerEmail, buyerEmail, escrowId) {
	  // Set up email template and dynamic data
	  const templateParams = {
	    seller_email: sellerEmail,
	    buyer_email: buyerEmail,
	    trade_id: escrowId
	  };

	  // Send the email using EmailJS
	  emailjs.send('service_neeyeed@gmail', templateId, templateParams)
	    .then((response) => console.log(`Email sent to ${sellerEmail}: ${response.status}`))
	    .catch((error) => console.error('Error sending email:', error));  
  };

	$scope.updateStatus = function(status, sellerEmail, buyerEmail, escrowId) {
		console.log("updateStatus: " + status);
		const docRef = db.collection('EscrowItem').doc(escrowId);
		docRef.update({
			tradeStatus: status,
			dateEdited: firebase.firestore.FieldValue.serverTimestamp()
		})
		.then(() => {
			alert('Status updated successfully');
			console.log('Status updated successfully');
			$scope.loadEscrowItems();
			$scope.$apply();
			$scope.sendEmail('template_status_update', sellerEmail, buyerEmail);
		})
		.catch((error) => {
			console.error('Error updating status:', error);
		});				
	};	
	
	$scope.paySeller = function(sellerBank, sellerBankAccount, tradeCurrency, tradeAmount, tradeFee, sellerEmail, buyerEmail, escrowId) {
		var status = 'COMPLETE'
		console.log("paySeller: " + status);
		
		const FLUTTERWAVE_SECRET_KEY = 'FLWSECK_TEST-1da1d1e6157e8e6546d6a510d2b95463-X';
		const CUSTOMER_ACCOUNT_NUMBER = sellerBankAccount; // The customer's account number
		const CUSTOMER_BANK_CODE = sellerBank; // The customer's bank code
		const AMOUNT_TO_TRANSFER = (tradeAmount - tradeFee) * 100; // The amount you want to transfer in kobo (converted from NGN). Also deduct charge.
		const CURRENCY = tradeCurrency; // The currency of the transfer

		const transferPayload = {
			account_bank: CUSTOMER_BANK_CODE,
			account_number: CUSTOMER_ACCOUNT_NUMBER,
			amount: AMOUNT_TO_TRANSFER,
			currency: CURRENCY,
			reference: "TR-REF" + Math.floor((Math.random() * 10000000000000) + 1), // Your unique transfer reference
			callback_url: '', // Your callback URL
			narration: 'ScrowIt! - Payout to Seller' // A description of the transfer
		};

		fetch('https://api.flutterwave.com/v3/transfers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ${FLUTTERWAVE_SECRET_KEY}'
			},
			body: JSON.stringify(transferPayload)
		})
		.then(response => {
			if (response.ok) {
				return response.json();
			} else {
				throw new Error('Network response was not ok.');
			}
		})
		.then(data => {
			updateStatus(status, escrowId, sellerEmail, buyerEmail);
			$scope.$apply();
			$scope.sendEmail('template_status_update', sellerEmail, buyerEmail);		
			console.log(data);
		})
		.catch(error => {
			console.error('Error:', error);
		});


/*		
		$http({
			method: 'POST',
			url: 'https://api.flutterwave.com/v3/transfers',
			headers: {
				'Authorization': 'Bearer ${FLUTTERWAVE_SECRET_KEY}',
				'Content-Type': 'application/json'
			},
			data: transferPayload
		}).then(function successCallback(response) {
				console.log("paySeller: " + response);
				updateStatus(status, escrowId, sellerEmail, buyerEmail);
				$scope.$apply();
				$scope.sendEmail('template_status_update', sellerEmail, buyerEmail);
			}, function errorCallback(response) {
				console.log(response);
			});		
*/
		// Make a POST request to the Transfer API
/*		axios.post('https://api.flutterwave.com/v3/transfers', transferPayload, {
			headers: {
				'Authorization': 'Bearer ${FLUTTERWAVE_SECRET_KEY}',
				'Content-Type': 'application/json'
			},
  		withCredentials: true
		})
			.then(response => {
				console.log(response.data);
				updateStatus(status, escrowId, sellerEmail, buyerEmail);
			})
			.catch(error => {
				console.error(error);
			});
*/		
	};	  

	$scope.cancelledPayment = function(event) {
		console.log("cancelledPayment: ");
	};
});  	



