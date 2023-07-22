(function () {
  var app = angular.module("myApp", []);

  app.controller("demoCtrl", ["$scope", DemoController]);

  function getDataPromise(url) {
    return new Promise(function (resolve, reject) {
      $.get(url, function (data, status) {
        if (status === "success") {
          resolve(data);
        }
        reject(new Error("Error while getting " + url));
      });
    });
  }

  const USER_API = "https://jsonplaceholder.typicode.com/users";
  const POST_API = "https://jsonplaceholder.typicode.com/posts?userId=";
  const COMMENT_API = "https://jsonplaceholder.typicode.com/comments?postId=";

  function DemoController($scope) {
    // Your Code Here
    // Callback-style
    $.get(USER_API, function (users) {
      let usersWithData = [];
      let count = 0;
      users.forEach(function (user) {
        $.get(POST_API + user.id, function (posts) {
          user.posts = [];
          posts.forEach(function (post) {
            $.get(COMMENT_API + post.id, function (comments) {
              post.comments = comments;
            });
            user.posts.push(post);
          });
          usersWithData.push(user);
          count++;
          if (count === users.length) {
            $scope.$apply(function () {
              $scope.users = usersWithData;
            });
          }
        });
      });
    });
    // Promise-style
    let allUsers;
    getDataPromise(USER_API)
      .then(function (users) {
        var usersWithData = [];

        var userPromises = users.map(function (user) {
          return getDataPromise(POST_API + user.id).then(function (posts) {
            // Fetch comments for each post
            var postPromises = posts.map(function (post) {
              return getDataPromise(COMMENT_API + post.id).then(function (
                comments
              ) {
                post.comments = comments;
                return post;
              });
            });

            return Promise.all(postPromises).then(function (postsData) {
              user.posts = postsData;
              return user;
            });
          });
        });

        return Promise.all(userPromises).then(function (usersData) {
          usersWithData = usersData;
          $scope.$apply(function () {
            $scope.users = usersWithData;
          });
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    //   //...
    // Async/await-style
    async function fetchData() {
      try {
        const users = await getDataPromise(USER_API);
        const usersWithData = await Promise.all(
          users.map(async (user) => {
            const posts = await getDataPromise(POST_API + user.id);
            const postsWithData = await Promise.all(
              posts.map(async (post) => {
                const comments = await getDataPromise(COMMENT_API + post.id);
                post.comments = comments;
                return post;
              })
            );
            user.posts = postsWithData;
            return user;
          })
        );
        return usersWithData;
      } catch (error) {
        console.log(error);
        return [];
      }
    }

    fetchData().then(function (usersWithData) {
      $scope.$apply(function () {
        $scope.users = usersWithData;
      });
    });
  }
})();
