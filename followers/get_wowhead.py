import urllib2, json

for i in range(408, 414) :
    html = urllib2.urlopen("http://www.wowhead.com/mission=" + str(i)).read().split("\n")
    for line in html :
        if "new MissionCalc" in line : 
            j = line.find("mission:")
            s = line[j + 9:-4]
            o = json.loads(s)
            o2 = {}
            o2["slot"] = o["followers"]
            o2["id"] = o["id"]
            o2["type"] = o["mechanictype"]
            o2["ability"] = []
            for _, e in o["encounters"].iteritems() :
                for _, m in e["mechanics"].iteritems() :
                    o2["ability"].append(m["type"])
            print json.dumps(o2) + ","
