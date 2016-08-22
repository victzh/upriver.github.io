function Upriver(token) {
  $.ajaxSetup({
    headers: {
      'Authorization': 'token ' + sessionStorage.getItem('token')
    }
  });

  var self = this;

  $('#forkRepo').change(function() {
    var selected = $(this).children('option:selected');
    $('#parentRepo option[data-name=\'' + selected.attr('data-parent') + '\']').prop('selected', true).change();
    self.loadBranches(selected.text(), '#forkBranch');
  });

  $('#forkBranch').change(function() {
    var selected = $(this).children('option:selected');
    $('#parentBranch option[data-name=\'' + selected.attr('data-name') + '\']').prop('selected', true).change();
  });

  $('#parentRepo').change(function() {
    var selected = $(this).children('option:selected');
    self.loadBranches(selected.text(), '#parentBranch');
  });

  $('#pull').click(this.pull);

  this.loadRepos(function() {
    $('#forkRepo').change();
    $('#parentRepo').change();
  });
}

Upriver.prototype.getRepo = function(repo, callback) {
  $.getJSON('https://api.github.com/repos/' + repo, callback);
};

Upriver.prototype.getRepos = function(callback) {
  $.getJSON('https://api.github.com/user', function(user) {
    $.getJSON(user.repos_url, callback);
  });
};

Upriver.prototype.addRepo = function(repo) {
  $('<option></option>')
    .text(repo.full_name)
    .attr('data-name', repo.full_name)
    .attr('data-parent', (repo.parent) ? repo.parent.full_name : '')
    .appendTo('#forkRepo');

  $('<option></option>')
    .text(repo.parent.full_name)
    .attr('data-name', repo.parent.full_name)
    .appendTo('#parentRepo');
};

Upriver.prototype.loadRepos = function(callback) {
  this.getRepos(function(repos) {
    var queue = async.queue(function(repo, callback) {
      this.getRepo(repo.full_name, function(repo) {
        this.addRepo(repo);
        callback();
      }.bind(this));
    }.bind(this), 6);

    queue.drain = callback;

    repos.filter(function(repo) {
      return repo.fork;
    }).forEach(function(repo) {
      queue.push(repo);
    });
  }.bind(this));
};

Upriver.prototype.getBranches = function(repo, callback) {
  $.getJSON('https://api.github.com/repos/' + repo + '/branches', callback);
};

Upriver.prototype.addBranch = function(element, branch) {
  $('<option></option>')
    .text(branch.name)
    .attr('data-name', branch.name)
    .attr('data-sha', branch.commit.sha)
    .appendTo(element);
};

Upriver.prototype.loadBranches = function(repo, element) {
  this.getBranches(repo, function(branches) {
    $(element).html('');
    branches.forEach(this.addBranch.bind(this, element));
    $(element).children('option[data-name=\'master\']').prop('selected', true).change();
  }.bind(this));
};

Upriver.prototype.pull = function() {
  var forkRepo = $('#forkRepo').children('option:selected').text();
  var forkBranch = $('#forkBranch').children('option:selected').text();
  var parentSha = $('#parentBranch').children('option:selected').attr('data-sha');
  var force = $('#force').prop('checked');

  $.ajax({
    type: 'PATCH',
    dataType: "json",
    url: 'https://api.github.com/repos/' + forkRepo + '/git/refs/heads/' + forkBranch,
    data: JSON.stringify({
      sha: parentSha,
      force: force
    }),
    complete: function(xhr) {
      var data = JSON.parse(xhr.responseText);
      $('#modal pre').text(JSON.stringify(data, undefined, 2));
      $('#modal').modal('show');
    }
  });
};

$(function() {
  $('[data-toggle="tooltip"]').tooltip();

  if (sessionStorage.getItem('token')) {
    $('#signin').hide();
    $('#controls').show();
    window.upriver = new Upriver(sessionStorage.getItem('token'));
  }
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-51171425-3', 'auto');
ga('send', 'pageview');
