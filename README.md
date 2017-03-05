# convoy :blue_car: :car: :car: :car:

[![Devpost](https://img.shields.io/badge/devpost-UBER%20Hacks-lightgrey.svg)](https://devpost.com/software/convoy-q5l9k4)
![](https://img.shields.io/badge/hosted-Linode-green.svg)
![](https://img.shields.io/badge/backend-Express-brightgreen.svg)
![](https://img.shields.io/badge/frontend-Twilio-red.svg)

> Ordering Ubers for Unordered groups

Try it out at [+1 (504) 2-CONVOY (+1 (504) 266-6869)](tel://5042266869).

## Inspiration

Picture this: You're with your large group of friends at a party, and you all want to get to the bar. You can't drive (parking, need to have a DD, not enough cars), public transit would take a while, and you just want to keep it simple and call up Uber. But it's complicated, you want to make sure your entire squad gets to the right place at the same time, which means you need to text out the address, organize groups, etc. But it doesn't have to be complicated if you make a Convoy.

## What it does

Convoy is a simple text based SMS service for booking a whole bunch of Ubers to a set destination at once. It handles parsing the source and destination addresses, inviting members to a group, splitting the group into the optimal configuration of Uber cars (currently supports Uber and UberXL) and randomly selecting members to book them, and broadcasting the status of each car on the way to the destination.

The service is initiated by the organizer (or "commander") of the convoy texting us a message `convoy from ____ to ____`. The source and destination are queried through Google Maps, and the reply contains the street addresses to confirm, as well as a unique join code to pass out to each member.

Each member joins the convoy by texting `join ____` (with the unique code), and is able to confirm the source and destination addresses. From there, they wait until the commander sends "done" to start the convoy.

At this point, our backend calculates the optimal configuration of Ubers, and partitions the convoy into groups, each headed by a "captain" which will be the one booking the Uber. The captains are given a link to log in with Uber, and when everyone has confirmed, the Ubers are ordered and the other members texted a notice of who to pay and how much (split evenly between all passengers). Members of the convoy receive status updates on people's rides, and can travel safely to their destination knowing that everything is taken care of.

## How We built it

## Challenges We ran into

## Accomplishments that We're proud of

## What We learned

## What's next for Convoy
