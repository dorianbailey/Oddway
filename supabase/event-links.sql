-- Promote Facebook pages into the website column so they render as links.
--
-- For a lot of small-town festivals the Facebook page IS the official site.
-- Leaving the URL as plain text inside a contact note made it unusable: the
-- one thing a traveller wants is a way to check whether the event is still
-- happening, and that was the link.
--
-- Deliberately no deletions. A dormant page does not reliably mean a dead
-- festival — plenty are organised through a county visitor centre rather than
-- their own account — and the listing now tells people to check rather than
-- quietly dropping events on a weak signal.

update public.events set website = 'https://facebook.com/profile.php?id=100094542990087' where slug = 'big-muddy-monster-festival';
update public.events set website = 'https://facebook.com/bigfootdazewc/' where slug = 'bigfoot-daze';
update public.events set website = 'https://facebook.com/Flatwoods-Monster-Fest-1254538164701000' where slug = 'flatwoods-monster-festival';
update public.events set website = 'https://facebook.com/OhioBigfootConference' where slug = 'hocking-hills-bigfoot-festival';
update public.events set website = 'https://facebook.com/LakeWorthMonsterBash' where slug = 'lake-worth-monster-bash';
update public.events set website = 'https://facebook.com/Bigfoot-CON-2022-Yakima-121038510172676' where slug = 'yakima-valley-bigfoot-con';
