javascript:(function(){
	var token = $.cookie('token');

	var parts = /\/c\/([^/]+)/.exec(document.location);

	if(!parts) {
		alert('No cards are open.');
		return false;
	}
	var idCard = parts[1];
	$.get('/1/cards/' + idCard, { fields: 'idList', checklists: 'all' })
	.success(function(json){
		var idList = json.idList;
		var checklists = json.checklists;

		var checkItems = [];

		for (var i = checklists.length - 1; i >= 0; i--) {
			checklist = checklists[i];
			var idChecklist = checklist.id;
			for (var j = 0; j < checklist.checkItems.length; j++) {
				
				checkItem = checklist.checkItems[j];
				checkItems.push({
					idChecklist: idChecklist,
					name: checkItem.name,
					id: checkItem.id
				});
			}
			
		}

		var createNextCard = function() {
			if(checkItems.length == 0) {
				return false;
			}
			var checkItem = checkItems.shift();

			var name = checkItem.name;

			$.post('/1/card', {
				token: token,
				idList: idList,
				name: name,
				pos: 'bottom'
			})
			.success(function(response){
				$.ajax({
					'method': 'put',
					'url': '/1/cards/' + idCard + '/checklist/' + checkItem.idChecklist + '/checkItem/' + checkItem.id,
					'data': {
						'name': response.url,
						'token': token
					}
				});
				createNextCard();
			});

		};

		createNextCard();

	});
})();
