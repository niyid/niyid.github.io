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
    console.error(exception);
    // add any custom error handling code here
  };
});
  
// Define the 'myController' controller
app.controller('ScrowItController', function($scope) {
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
				var selCurrency =	$scope.tradeCurrency.split(",");
				console.log('Selected tradeCurrency:', $scope.tradeCurrency);
				console.log('Selected value,label:', selCurrency);
				console.log("Escrow data: ", $scope.description + " " + $scope.buyerEmail + " " + $scope.tradePeriod + " " + $scope.tradeAmount);
				db.collection('EscrowItem').add({
				  description: $scope.description,
				  sellerEmail: $scope.user.email,
				  buyerEmail: $scope.buyerEmail,
				  tradePeriod: $scope.tradePeriod,
				  tradeAmount: $scope.tradeAmount,
				  tradeStatus: "PAY",
				  tradeCurrencySymbol: selCurrency[0],
				  tradeCurrency: selCurrency[1],
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
				  $scope.tradePeriod = '';
				  $scope.tradeAmount = '';
				  $scope.tradeStatus = 'PAY';
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
});  	



