#include <iostream>
#include <string>
#include <cassert>
#include <memory>
#include <fstream>
#include <algorithm>
#include <iterator>
#include <regex>
#include <json/json.h>

void ReadJson(const std::string path, Json::Value& out) {
    static Json::Reader reader;
    std::ifstream ifs(path);
    assert(ifs);
    reader.parse(ifs, out, false);
    if (not reader.good()) {
        std::cout << reader.getFormattedErrorMessages() << std::endl;
    }
    assert(reader.good());
}

int main() {
    Json::Value myFollowers, garrisonFollowers, garrisonAbilities, garrisonMissions;

    ReadJson("static/my_followers.json", myFollowers);
    ReadJson("static/garrison_followers.json", garrisonFollowers);
    ReadJson("static/garrison_abilities.json", garrisonAbilities);
    ReadJson("static/garrison_missions.json", garrisonMissions);
}
