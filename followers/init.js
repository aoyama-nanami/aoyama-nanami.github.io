var wowhead_tooltips = { "colorlinks": true, "iconizelinks": true, "renamelinks": true }

function CreateFollowerTooltip(follower) {
    var rel = "level=" + follower.level + "&q=" + follower.quality +
        "&abil=" + $.map(follower.ability, function(ability) { return ability.id }).join(":")
    
    var a = $("<a></a>")
        .attr("href", "http://www.wowhead.com/follower=" + follower.garrFollowerID + ".2")
        .attr("class", "q" + follower.quality)
        .attr("rel", rel)
    var img = $("<img/>")
        .attr("src", "http://wow.zamimg.com/images/wow/garr/" +
                g_garrison_followers[follower.garrFollowerID].horde.portrait + ".png")
        .attr("class", "followerPortrait")

    var span = $("<span></span>")

    return span.append(img).append(a)
}

function CreateFollowerPartyRow(party, required_score) {
    var tr = $("<tr>")
    tr.append("<td>" + (party.score * 100 / required_score).toFixed(2) + "%</td>")
        .append($("<td>").text(party.score))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[0]])))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[1]])))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[2]])))
    return tr
}

$(document).ready(function() {
    var blackrock_missions = [
        {"slot": 3, "type": 18, "id": 454, "ability": [3, 6, 1, 2, 10, 7, 9]},
        {"slot": 3, "type": 21, "id": 455, "ability": [2, 6, 1, 3, 10, 8, 3]},
        {"slot": 3, "type": 24, "id": 456, "ability": [4, 3, 8, 4, 7, 7, 6]},
        {"slot": 3, "type": 11, "id": 457, "ability": [1, 10, 3, 6, 9, 8, 2]},
    ]

    var highmaul_missions = [
        {"slot": 3, "type": 28, "id": 321, "ability": [8, 6, 1, 9, 2, 10]},
        {"slot": 3, "type": 17, "id": 322, "ability": [3, 6, 4, 7, 1, 3]},
        {"slot": 3, "type": 12, "id": 323, "ability": [4, 7, 2, 10, 10, 9]},
        {"slot": 3, "type": 29, "id": 324, "ability": [8, 6, 1, 9, 10, 9]},
    ]

    var elemental_rune_missions = [
        {"slot": 3, "type": 11, "id": 408, "ability": [7, 3, 6, 2, 10, 1]},
        {"slot": 3, "type": 22, "id": 409, "ability": [1, 6, 9, 2, 9, 3]},
        {"slot": 3, "type": 16, "id": 410, "ability": [4, 2, 3, 9, 8]},
        {"slot": 3, "type": 29, "id": 411, "ability": [2, 9, 3, 8, 3, 6]},
        {"slot": 3, "type": 24, "id": 412, "ability": [7, 2, 3, 2, 9, 3]},
        {"slot": 3, "type": 27, "id": 413, "ability": [7, 2, 6, 1, 4, 8]},
    ]

    var button_factory = function(name, missions, required_ilv, max_ilv) {
        var button = $("<button>")
            .text(name)
            .addClass("request_worker")
            .click(function(){Compute(missions, required_ilv, max_ilv)})
        $("#button_container").append(button)
    }

    button_factory("blckrock", blackrock_missions, 660, 670)
    button_factory("highmaul", highmaul_missions, 645, 655)
    button_factory("elemental rune", elemental_rune_missions, 645, 655)
})

function Compute(missions, required_ilv, max_ilv) {
    var start_time = new Date().getTime()

    var container = $("#result_container")
    container.empty()
    $("#minimal_party, #message").empty()
    $("button.request_worker").prop("disabled", true)

    for (var i = 0; i < missions.length; i++) {
        missions[i].score = 90 * missions[i].ability.length + 30 * missions[i].slot
        delete missions[i].element
    }

    var worker = new Worker("worker.js")
    worker.postMessage({"missions": missions, "followers": my_followers,
        "required_ilv": required_ilv, "max_ilv": max_ilv,
        "garrison_abilities": g_garrison_abilities, "garrison_followers": g_garrison_followers,})

    for (var i = 0; i < missions.length; i++) {
        var a = $("<a>").attr("href", "http://ptr.wowhead.com/mission=" + missions[i].id)
            .addClass("mission_link")
        var table = $("<table>")
        missions[i].element = table
        container.append([a, table, "<hr/>"])
    }

    var output_tables = missions.map(function(m){ return m.element })

    worker.onmessage = function(e) {
        var best_list = e.data.best_list
        var best = e.data.best_score

        var message = e.data.message
        if (message) {
            $("#message").append([$("<span>").text(message), "<br/>"])
        }

        if (best_list == undefined) return

        best_list.forEach(function(p, i) {
            var tr = $("<tr>")

            Object.keys(p.party).forEach(function(x) {
                var td = $("<td>")
                td.append(CreateFollowerTooltip(my_followers[x]))
                if (my_followers[x].iLevel != p.party[x]) {
                    td.append($("<span>").html("(" + my_followers[x].iLevel + " &#8594; " + p.party[x] + ")"))
                } else {
                    td.append($("<span>").text("(" + p.party[x] + ")"))
                }
                tr.append(td)
            })
            tr.append($("<td>").text("+" + best + " iLevel"))

            p.elements = []
            for (var j = 0; j < p.rows.length; j++) {
                if (typeof p.rows[j].element == "undefined") {
                    p.rows[j].element = CreateFollowerPartyRow(p.rows[j], missions[j].score)
                    $(output_tables[j]).append(p.rows[j].element)
                }
                p.elements.push(p.rows[j].element)
            }

            $(tr).hover(
                function(){ $.each(p.elements, function(i, e) { e.addClass("highlight") }) },
                function(){ $.each(p.elements, function(i, e) { e.removeClass("highlight") }) }
            )

            $("#minimal_party").append(tr)
        })

        var span = $("<span>").text("computation time: " + (new Date().getTime() - start_time) + "ms")
        $("#message").append([span, "<br/>"])
        $("button.request_worker").prop("disabled", false)
        $WowheadPower.refreshLinks()
    }

}
