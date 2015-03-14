import urllib2, json, itertools

blackrock = xrange(454, 458)
highmaul = xrange(321, 325)
elemental_rune = xrange(408, 414)
retrain = [503]
apexis = [391, 399]

print "var missions = {"
for i in itertools.chain(blackrock, highmaul, elemental_rune, retrain, apexis) :
    html = urllib2.urlopen("http://www.wowhead.com/mission=" + str(i)).read().split("\n")
    for line in html :
        if "new MissionCalc" in line : 
            j = line.find("mission:")
            s = line[j + 9:-4]
            print "\"%d\": %s," % (i, s)
            o = json.loads(s)
            o2 = {}
            o2["slot"] = o["followers"]
            o2["id"] = o["id"]
            o2["type"] = o["mechanictype"]
            o2["ability"] = []
            for _, e in o["encounters"].iteritems() :
                for _, m in e["mechanics"].iteritems() :
                    o2["ability"].append(m["type"])
            # print json.dumps(o2) + ","
print "}"
