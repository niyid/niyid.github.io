var config = {
	apiKey: "AIzaSyC_aG9gh6Lm3VY1Ce9wnUcRbkiMO4gYyPY",
	authDomain: "scrowit.firebaseapp.com",
	projectId: "scrowit",
	storageBucket: "scrowit.appspot.com",
	messagingSenderId: "878425882680",
	appId: "1:878425882680:web:f6bc895f39ee09afbfa6cd",
};
firebase.initializeApp(config);

const escrow = angular.module("ScrowIt", ["firebase", "ngRoute", "ngAnimate", "ngSanitize", "ngTouch", "angular.filter", "angular-loading-bar", "monospaced.elastic"]);

// Define AngularJS controller
escrow.controller('EscrowItemsController', function($scope) {
  // Initialize Firestore Database
  const db = firebase.firestore();

  // Initialize Firebase Authentication
  const auth = firebase.auth();

  // Watch for user authentication state changes
  auth.onAuthStateChanged(function(user) {
    $scope.$apply(function() {
      $scope.user = user;
      if (user) {
        $scope.newItem = {
          sellerEmail: user.email
        };
        $scope.loadEscrowItems();
      }
    });
  });

  // Load escrow items from Firestore Database
  $scope.loadEscrowItems = function() {
    db.collection('escrowItems')
      .where('sellerEmail', '==', $scope.user.email)
      .orWhere('buyerEmail', '==', $scope.user.email)
      .get()
      .then(function(querySnapshot) {
        $scope.escrowItems = querySnapshot.forEach(function(doc) {
        console.log(doc.id, doc.data());
      });
    })
    .catch(function(error) {
      console.error('Error retrieving EscrowItems: ', error);
    });
};

