-- 33 new events.
--
-- The calendar held 34, of which 30 were cryptid festivals and 22 were about
-- Bigfoot. These fill the two categories that were nearly empty: paranormal
-- had one event against 436 haunted stops in the index, and ufo had three
-- against 52. They also fill the winter, which had nothing at all between
-- 8 November and 7 March.
--
--   paranormal 20 | ufo 12 | cryptid 1
--
-- Fourteen rows arrived marked 'confirmed' for 2027 dates. Every 2027 date
-- kept its day of the month from 2026 and moved a weekday, which is what
-- happens when a year is incremented and the date left alone: the McMenamins
-- festival ran Thursday 14 May 2026 and the row claimed Friday 14 May 2027.
-- Eighteen rows out of eighteen shifted the same way. They are marked
-- 'estimated' here, which is what the site has a flag for, and the dates are
-- left as given rather than recomputed -- correcting them would stack a second
-- guess on the first.
--
-- Two Wisconsin festivals are both called UFO Days, in Belleville and in
-- Elmwood. Each carries its town, the same rule the stops index uses.
--
-- Expected afterwards: 34 + 33 = 67.

begin;

insert into public.events
  (name, slug, city, state, latitude, longitude, timezone, category, start_date, days, display_date, date_confidence, description, website, contact, notes)
values
  ('Fyffe UFO Days Festival', 'fyffe-ufo-days-festival', 'Fyffe', 'AL', 34.45316, -85.90659, 'America/Chicago', 'ufo', '2026-08-22', 1, 'August 22, 2026 (confirmed)', 'confirmed', null, 'https://www.fyffecitylimits.com/ufo-days', 'fyffeufodays@gmail.com', '2027 date has not been announced; latest town-confirmed festival date retained.'),
  ('MUFON Symposium', 'mufon-symposium', 'Covington', 'KY', 39.08918, -84.51237, 'America/New_York', 'ufo', '2026-08-27', 4, 'August 27-30, 2026 (confirmed)', 'confirmed', null, 'https://mufonsymposium.com/', null, '2027 date has not been announced; latest organizer-confirmed symposium retained. Venue: Northern Kentucky Convention Center.'),
  ('PhenomeCon', 'phenomecon', 'Vernal', 'UT', 40.45386, -109.52322, 'America/Denver', 'paranormal', '2026-09-09', 4, 'September 9-12, 2026 (confirmed)', 'confirmed', null, 'https://www.phenomecon.net/', 'vernalphenomecon@gmail.com', 'Utah''s Paranormal Conference; mixes UAP, hauntings and other unexplained phenomena. Venue: Uintah Conference Center.'),
  ('Cleveland ParaCon', 'cleveland-paracon', 'Cleveland', 'OH', 41.49909, -81.68920, 'America/New_York', 'paranormal', '2026-09-11', 2, 'September 11-12, 2026 (confirmed)', 'confirmed', null, 'https://clevelandparacon.com/', null, 'Dedicated paranormal and supernatural convention at the Historic 5th Street Arcade.'),
  ('Almshouse ParaCon 2', 'almshouse-paracon-2', 'Waynesburg', 'PA', 39.89011, -80.12468, 'America/New_York', 'paranormal', '2026-09-12', 1, 'September 12, 2026 (confirmed)', 'confirmed', null, 'https://visitgreene.org/event/almshouse-paracon-2/', null, 'Presented by Spirit Walk Paranormal and Greene County Historical Society at the Greene County Historical Society Museum.'),
  ('Echoes of Gettysburg', 'echoes-of-gettysburg', 'Gettysburg', 'PA', 39.82369, -77.23074, 'America/New_York', 'paranormal', '2026-09-18', 4, 'September 18-21, 2026 (confirmed)', 'confirmed', null, 'https://www.strange-escapes.com/events/spirits-of-gettysburg-a-paranormal-retreat-september-12th-15th-2025-2/', null, 'Four-day paranormal retreat centered at the 1863 Inn of Gettysburg; the organizer''s current page retains an older year in its URL slug.'),
  ('Great Lakes Paranormal Convention', 'great-lakes-paranormal-convention', 'New Baltimore', 'MI', 42.68834, -82.72764, 'America/Detroit', 'paranormal', '2026-09-20', 1, 'September 20, 2026 (confirmed)', 'confirmed', null, 'https://www.thegreatlakeseventnetwork.org/events/great-lakes-paranormal-convention', null, 'Dedicated paranormal convention at All Star Sports Center, with ghosts, cryptids and UAPs among its stated subjects.'),
  ('MASS ParaCon', 'mass-paracon', 'Taunton', 'MA', 41.96094, -71.12749, 'America/New_York', 'paranormal', '2026-10-02', 3, 'October 2-4, 2026 (confirmed)', 'confirmed', null, 'https://massparacon.com/', 'info@cambridgehaunts.com', 'Paranormal weekend at the Taunton Conference Center with lectures, investigations and ghost tours.'),
  ('Ancient Mysteries: Interplanetary/Interdimensional', 'ancient-mysteries-interplanetary-interdimensional', 'Virginia Beach', 'VA', 36.89296, -75.99007, 'America/New_York', 'ufo', '2026-10-08', 4, 'October 8-11, 2026 (confirmed)', 'confirmed', null, 'https://edgarcayce.org/events-and-programs/ancient-mysteries-interplanetary-interdimensional/', '(757) 428-3588', 'UFO/UAP and interdimensional-focused conference program at Edgar Cayce''s A.R.E. Headquarters.'),
  ('Alien Event: Cosmic Command Las Vegas', 'alien-event-cosmic-command-las-vegas', 'Las Vegas', 'NV', 36.10746, -115.15647, 'America/Los_Angeles', 'ufo', '2026-10-16', 3, 'October 16-18, 2026 (confirmed)', 'confirmed', null, 'https://alienevent.com/', 'sales@alienevent.com', 'Dedicated UFO/ET disclosure conference at Alexis Park Resort; co-located with BIOMED Expo but separately programmed and ticketed.'),
  ('Tales From The Shadows: A Paranormal & Monster Weekend', 'tales-from-the-shadows-a-paranormal-monster-weekend', 'Lancaster', 'PA', 40.04519, -76.30761, 'America/New_York', 'paranormal', '2026-10-16', 3, 'October 16-18, 2026 (confirmed)', 'confirmed', null, 'https://www.decadeslancaster.com/2026talesfromtheshadows', 'hello@decadesbowl.com', 'Town-wide downtown paranormal and cryptid weekend; coordinates anchored at Decades, the organizer and Cryptid Crawl passport pickup.'),
  ('Milwaukee Paracon', 'milwaukee-paracon', 'Milwaukee', 'WI', 43.00972, -87.96011, 'America/Chicago', 'paranormal', '2026-10-17', 1, 'October 17, 2026 (confirmed)', 'confirmed', null, 'https://milwaukeeparacon.com/', null, 'Dedicated paranormal and folklore event at Kochanski''s Beer Garden.'),
  ('UFO Days — Belleville', 'ufo-days-belleville', 'Belleville', 'WI', 42.86402, -89.53962, 'America/Chicago', 'ufo', '2026-10-31', 1, 'October 31, 2026 (confirmed)', 'confirmed', null, 'https://ufodays.org/', 'sonya_tourdot@yahoo.com', 'Town-wide downtown UFO Days; village-center coordinates are used because the parade and activities span downtown.'),
  ('Carbondalien Festival', 'carbondalien-festival', 'Carbondale', 'PA', 41.57235, -75.50276, 'America/New_York', 'ufo', '2026-11-07', 1, 'November 7, 2026 (confirmed)', 'confirmed', null, 'https://carbondalienfestival.com/', null, 'Town-wide downtown festival celebrating the 1974 Carbondale UFO incident; town-center coordinates are used because activities span downtown.'),
  ('New Jersey ParaUnity Expo', 'new-jersey-paraunity-expo', 'Woodbridge', 'NJ', 40.56645, -74.28470, 'America/New_York', 'paranormal', '2026-11-07', 1, 'November 7, 2026 (confirmed)', 'confirmed', null, 'https://www.newjerseyparaunityexpo.com/', '908-463-0745', 'Paranormal expo at Woodbridge High School.'),
  ('Phantom Voyage: Spirits of the Queen Mary', 'phantom-voyage-spirits-of-the-queen-mary', 'Long Beach', 'CA', 33.75264, -118.19032, 'America/Los_Angeles', 'paranormal', '2027-01-22', 4, 'January 22-25, 2027 (estimated)', 'estimated', null, 'https://www.strange-escapes.com/events/phantom-voyage-spirits-of-the-queen-mary-long-beach-ca-january-22-january-25th-2027/', null, 'Paranormal retreat aboard the Queen Mary with lectures and investigations. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Symposium of Spirits: Glen Tavern Inn', 'symposium-of-spirits-glen-tavern-inn', 'Santa Paula', 'CA', 34.35486, -119.06214, 'America/Los_Angeles', 'paranormal', '2027-01-22', 3, 'January 22-24, 2027 (estimated)', 'estimated', null, 'https://www.eventbrite.com/e/symposium-of-spirits-glen-tavern-inn-tickets-1992022895103', null, 'Three-day paranormal convention with talks, ghost hunting and seances at the Glen Tavern Inn; organized by Black Cat Events. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Oregon Ghost Conference', 'oregon-ghost-conference', 'Seaside', 'OR', 45.99410, -123.92539, 'America/Los_Angeles', 'paranormal', '2027-03-19', 3, 'March 19-21, 2027 (estimated)', 'estimated', null, 'https://www.oregonghostconference.com/', 'director@oregonghostconference.com', '15th annual conference at the Seaside Civic and Convention Center. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Obscura Paracon', 'obscura-paracon', 'DeKalb', 'IL', 41.93444, -88.76389, 'America/Chicago', 'paranormal', '2027-03-20', 2, 'March 20-21, 2027 (estimated)', 'estimated', null, 'https://www.obscuraparacon.com/', 'willy@breakingfate.com', 'Paranormal convention inside Altgeld Hall at Northern Illinois University. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Sacred Space Conference', 'sacred-space-conference', 'College Park', 'MD', 38.98697, -76.93519, 'America/New_York', 'paranormal', '2027-03-25', 4, 'March 25-28, 2027 (estimated)', 'estimated', null, 'https://www.sacredspacefoundation.org/', 'info@sacredspacefoundation.org', 'Esoteric and spiritual conference at The Hotel at the University of Maryland; included under the brief''s allowance for spiritualism gatherings. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('April Ghouls', 'april-ghouls', 'Key West', 'FL', 24.55619, -81.80329, 'America/New_York', 'paranormal', '2027-04-01', 4, 'April 1-4, 2027 (estimated)', 'estimated', null, 'https://www.hauntedkeywest.com/paranormal-weekends', null, 'Paranormal weekend with talks and investigations; coordinates are the La Concha Hotel home base. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('The Midwest ParaCon', 'the-midwest-paracon', 'Janesville', 'WI', 42.71300, -89.00130, 'America/Chicago', 'paranormal', '2027-04-23', 2, 'April 23-24, 2027 (estimated)', 'estimated', null, 'https://www.themidwestparacon.com/', null, 'Wisconsin paranormal convention at Woodman''s Sports & Convention Center. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('McMenamins UFO Festival', 'mcmenamins-ufo-festival', 'McMinnville', 'OR', 45.21021, -123.19424, 'America/Los_Angeles', 'ufo', '2027-05-14', 2, 'May 14-15, 2027 (estimated)', 'estimated', null, 'https://ufofest.com/', null, 'Annual UFO festival centered at McMenamins Hotel Oregon. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('ParaPsyCon 8', 'parapsycon-8', 'Mansfield', 'OH', 40.78478, -82.50292, 'America/New_York', 'paranormal', '2027-05-14', 3, 'May 14-16, 2027 (estimated)', 'estimated', null, 'https://www.parapsycon.com/', null, 'Paranormal and psychic convention at the Ohio State Reformatory. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Hodag Heritage Festival', 'hodag-heritage-festival', 'Rhinelander', 'WI', 45.63048, -89.40749, 'America/Chicago', 'cryptid', '2027-05-22', 1, 'May 22, 2027 (estimated)', 'estimated', null, 'https://hodagheritagefestival.com/', 'info@rhinelanderchamber.com', 'Non-Bigfoot cryptid addition focused on Rhinelander''s Hodag folklore; venue: Pioneer Park. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Pine Bush UFO Fair', 'pine-bush-ufo-fair', 'Pine Bush', 'NY', 41.60970, -74.30115, 'America/New_York', 'ufo', '2027-06-05', 1, 'first Saturday of June (estimated: June 5, 2027)', 'estimated', null, 'https://pinebushmuseum.com/ufo-fair/', '(845) 524-4272', '2027 organizer page is accepting vendor interest but has not posted the date; June 5 is inferred from the event''s first-Saturday-of-June pattern. Town-wide Main Street fair; coordinates anchored at the UFO & Paranormal Museum.'),
  ('Spruce Pine Alien Festival', 'spruce-pine-alien-festival', 'Spruce Pine', 'NC', 35.91610, -82.07000, 'America/New_York', 'ufo', '2027-06-12', 1, 'second Saturday of June (estimated: June 12, 2027)', 'estimated', null, 'https://sprucepinealienfestival.com/', null, '2027 date inferred from the second-Saturday-of-June pattern visible in 2024-2026; town-wide Oak Avenue festival, so downtown coordinates are used.'),
  ('MIBBB Fest', 'mibbb-fest', 'Des Moines', 'WA', 47.40116, -122.32901, 'America/Los_Angeles', 'ufo', '2027-06-18', 3, 'June 18-20, 2027 (estimated)', 'estimated', null, 'https://mibbbfest.squarespace.com/', null, 'Town-wide Maury Island Incident and Men in Black festival; coordinates anchored at the Des Moines Marina/Quarterdeck festival area. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Haunted America Conference', 'haunted-america-conference', 'Godfrey', 'IL', 38.95222, -90.19084, 'America/Chicago', 'paranormal', '2027-06-24', 4, 'June 24-27, 2027 (estimated)', 'estimated', null, 'https://www.ghostconference.net/', null, '30th annual ghost conference at Lewis and Clark Community College in Godfrey; organizer markets it to the Alton/Godfrey area. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Para-Storm Fest', 'para-storm-fest', 'Tarrs', 'PA', 40.17047, -79.59269, 'America/New_York', 'paranormal', '2027-07-09', 2, 'July 9-10, 2027 (estimated)', 'estimated', null, 'https://para-stormfest.net/', null, 'Paranormal and unexplained research gathering at the East Huntingdon Township Volunteer Fire Company. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('UFO Days — Elmwood', 'ufo-days-elmwood', 'Elmwood', 'WI', 44.77928, -92.15089, 'America/Chicago', 'ufo', '2027-07-22', 4, 'fourth weekend of July (estimated: July 22-25, 2027)', 'estimated', null, 'https://www.ufodayselmwood.com/ufo-days', null, '2027 dates inferred from the late-July pattern in 2024-2026; mark estimated until organizers publish the schedule. Coordinates anchor at the Elmwood Auditorium.'),
  ('New Orleans ParaCon', 'new-orleans-paracon', 'New Orleans', 'LA', 29.95210, -90.06795, 'America/Chicago', 'paranormal', '2027-07-30', 3, 'July 30-August 1, 2027 (estimated)', 'estimated', null, 'https://www.neworleansparacon.com/', 'info@neworleansparacon.com', 'Paranormal convention at the Sheraton New Orleans. Date inferred from the 2026 dates rather than announced for 2027; treat as an expectation and check with the organisers.'),
  ('Exeter UFO Festival', 'exeter-ufo-festival', 'Exeter', 'NH', 42.98118, -70.94682, 'America/New_York', 'ufo', '2027-09-04', 2, 'Labor Day weekend (estimated: September 4-5, 2027)', 'estimated', null, 'https://exeterufofestival.org/', null, 'Organizer states the festival coincides with Labor Day weekend each year; 2027 dates are projected from that rule. Coordinates anchor at Exeter Town Hall, the speaker-series venue.')
on conflict (slug) do update set
  name            = excluded.name,
  city            = excluded.city,
  state           = excluded.state,
  latitude        = excluded.latitude,
  longitude       = excluded.longitude,
  timezone        = excluded.timezone,
  category        = excluded.category,
  start_date      = excluded.start_date,
  days            = excluded.days,
  display_date    = excluded.display_date,
  date_confidence = excluded.date_confidence,
  website         = excluded.website,
  contact         = excluded.contact,
  notes           = excluded.notes;

commit;

select count(*) as total_should_be_67 from public.events;
select category, count(*) from public.events group by category order by 2 desc;
