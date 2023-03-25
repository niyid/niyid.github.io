var config = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(config);

var app = angular.module('escrowApp', []);

app.controller('EscrowController', function($scope) {
  var db = firebase.firestore();

  $scope.items = [];

  $scope.createItem = function() {
    db.collection('EscrowItem').add({
      description: $scope.itemName,
      sellerEmail: $scope.sellerEmail,
      buyerEmail: $scope.buyerEmail,
      tradePeriod: $scope.tradePeriod,
      tradeAmount: $scope.tradeAmount
    })
    .then(function(docRef) {
      console.log("Document written with ID: ", docRef.id);
      $scope.itemName = '';
      $scope.sellerEmail = '';
      $scope.buyerEmail = '';
      $scope.tradePeriod = '';
      $scope.tradeAmount = '';
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
  };

  db.collection('EscrowItem').onSnapshot(function(querySnapshot) {
    $scope.items = [];
    querySnapshot.forEach(function(doc) {
      $scope.items.push(doc.data());
    });
    $scope.$apply();
  });
});

