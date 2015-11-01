Films = new Meteor.Collection("films");

currentFilmId = "currentFilmId";

if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault(currentFilmId, "");

    Template.filmList.helpers({
        films: function() {
            return Films.find({})
        }
    });

    Template.filmList.events({
        'click #filmList li': function (event) {
            event.preventDefault();
            console.log("click", this);
            Session.set(currentFilmId, this._id);
            $.mobile.changePage("#film-detail");
        }
    });

    Template.filmList.onRendered(function() {
        this.autorun(function() {
            setTimeout(function() {
                $("#filmList").listview("refresh");
            }, 50);
        });
    });

    Template.filmDetail.helpers({
        currentFilm: function() {
            return Films.findOne({_id: Session.get(currentFilmId)})
        }
    });

    Template.filmDetail.events({
        "click #remove": function(event) {
            event.preventDefault();
            Films.remove({_id: Session.get(currentFilmId)});
            $.mobile.changePage("#film-list");
        }
    });

    $(document).on('pagebeforeshow', function() {
        if ($.mobile.activePage.attr('id') === "film-detail" && Session.get(currentFilmId) === "") {
            $.mobile.changePage("#film-list");
        }
    });

    var searchResults = new ReactiveVar([]);
    var searchResult = function(json) {
        if (json.Search !== undefined) {
            searchResults.set(json.Search.map(function (el) {
                return {
                    title: el.Title,
                    avatarUrl: el.Poster,
                    imdbid: el.imdbID
                }
            }));
        } else {
            searchResults.set([]);
        }


        setTimeout(function() {
            $("#addFilmSearchList").listview("refresh");
        }, 200);
    };

    var searchOnIMDB = function(query) {
        Meteor.call("searchIMDB", query, function(error, result) {
            if(result.statusCode == 200) {
                searchResult(JSON.parse(result.content));
            } else {
                console.error("Response issue: ", result.statusCode);
                var errorJson = JSON.parse(result.content);
                throw new Meteor.Error(result.statusCode, errorJson.error);
            }
        });
    };

    var deboucedSearch = _.debounce(searchOnIMDB, 500);

    Template.add.events({
        "keyup #addFilmSearchField": function(event) {
            deboucedSearch(event.target.value);
        },
        "click #addFilmSearchList li": function(event) {
            event.preventDefault();
            console.log(this);
            Meteor.call("addMovie", this.imdbid);
            $.mobile.changePage("#film-list");
        }
    });

    Template.add.helpers({
        "searchResults": function() {
            return searchResults.get();
        }
    });
}

if (Meteor.isServer) {

    var addMovie = function(json) {
        Films.insert({
            title: json.Title,
            avatarUrl: json.Poster,
            description: json.Plot,
            imdbid: json.imdbID
        });
    };

    Meteor.methods({
        "searchIMDB": function(query) {
            this.unblock();
            return Meteor.http.call("GET", "http://www.omdbapi.com/?s="+query+"&plot=full&r=json");
        },
        "addMovie": function(imdbid) {
            this.unblock();
            var result = Meteor.http.get("http://www.omdbapi.com/?i="+imdbid+"&plot=full&r=json");
            if(result.statusCode == 200) {
                addMovie(JSON.parse(result.content));
            } else {
                console.error("Response issue: ", result.statusCode);
                var errorJson = JSON.parse(result.content);
                throw new Meteor.Error(result.statusCode, errorJson.error);
            }
        }
    });

    Meteor.startup(function () {
        if (Films.find({}).count() === 0) {
            console.log("EMPTY");
            Films.insert({
                title: "The Imitation Game",
                avatarUrl: "http://ia.media-imdb.com/images/M/MV5BNDkwNTEyMzkzNl5BMl5BanBnXkFtZTgwNTAwNzk3MjE@._V1_SY317_CR0,0,214,317_AL_.jpg",
                description:"During World War II, mathematician Alan Turing tries to crack the enigma code with help from fellow mathematicians.",
                imdbid: "tt2084970"
            });
            Films.insert({
                title: "Fury",
                avatarUrl: "http://ia.media-imdb.com/images/M/MV5BMjA4MDU0NTUyN15BMl5BanBnXkFtZTgwMzQxMzY4MjE@._V1_SX214_AL_.jpg",
                description: "April, 1945. As the Allies make their final push in the European Theatre, a battle-hardened Army sergeant named Wardaddy commands a Sherman tank and his five-man crew on a deadly mission behind enemy lines. Outnumbered, out-gunned, and with a rookie soldier thrust into their platoon, Wardaddy and his men face overwhelming odds in their heroic attempts to strike at the heart of Nazi Germany.",
                imdbid: "tt2713180"
            });
            Films.insert({
                title: "Django Unchained",
                avatarUrl: "http://ia.media-imdb.com/images/M/MV5BMjIyNTQ5NjQ1OV5BMl5BanBnXkFtZTcwODg1MDU4OA@@._V1_SX214_AL_.jpg",
                description: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
                imdbid: "tt1853728"
            });
            Films.insert({
                title: "Inglorious Basterds",
                avatarUrl: "http://ia.media-imdb.com/images/M/MV5BMjIzMDI4MTUzOV5BMl5BanBnXkFtZTcwNDY3NjA3Mg@@._V1_SY317_CR0,0,214,317_AL_.jpg",
                description: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans for the same.",
                imdbid: "tt0076584"
            });
        }
    });
}
