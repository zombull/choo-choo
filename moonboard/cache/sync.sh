#!/bin/bash

if [[ $1 == "problems" ]]; then
    for i in {1..135}; do
        if [[ ! -f "problems.$i.json" ]]; then
            printf "%s" "curl 'https://www.moonboard.com/Problems/GetProblems' -H '$cookie' -H 'Origin: https://www.moonboard.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.8' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: */*' -H 'Referer: https://www.moonboard.com/Problems/Index' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' --data 'sort=&page=$i&pageSize=100&group=&filter=' --compressed > problems.$i.json" | bash
            sleep .1
        fi

    done
fi

guid='6BE4A8C1-02C7-4BA4-9589-769ED0B3571C'
logs=(
    636357600000000000
    636346368000000000
    636229728000000000
    636231456000000000
    636237504000000000
    636250464000000000
    636254784000000000
    636255648000000000
    636257376000000000
    636260832000000000
    636261696000000000
    636290208000000000
    636291936000000000
    636303168000000000
    636304032000000000
    636310080000000000
    636315264000000000
    636316992000000000
    636320448000000000
    636321312000000000
    636323040000000000
    636326496000000000
    636328224000000000
    636341184000000000
    636345504000000000
    636361056000000000
    636362784000000000
    636363648000000000
    636364512000000000
    636370560000000000
    636374880000000000
    636375744000000000
    636379200000000000
    636381792000000000
    636382656000000000
    636388704000000000
    636412896000000000
    636419808000000000
    636424992000000000
    636431904000000000
    636140736000000000
    636141600000000000
    636142464000000000
    636151104000000000
    636152832000000000
    636153696000000000
    636167520000000000
    636170112000000000
    636174432000000000
    636176160000000000
    636177024000000000
    636189120000000000
    636189984000000000
    636198624000000000
    636203808000000000
    636205536000000000
    636207264000000000
    636214176000000000
    636215040000000000
    636219360000000000
    636220224000000000
)
if [[ $1 == "ticks" ]]; then
    for i in "${logs[@]}"; do
        if [[ ! -f "ticks.$i.json" ]]; then
            printf "%s" "curl 'https://www.moonboard.com/Account/GetLogbookEntries/$guid/$i' -H '$cookie' -H 'Origin: https://www.moonboard.com' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.8' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: */*' -H 'Referer: https://www.moonboard.com/Account/Profile/6BE4A8C1-02C7-4BA4-9589-769ED0B3571C' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' --data 'sort=&page=1&pageSize=30&group=&filter=' --compressed > ticks.$i.json" | bash
        fi
    done
fi