-- Sourcing the seven original demo entries.
--
-- These descriptions were written from general knowledge at the very start of
-- the project, before the index had any sourcing discipline. They were the most
-- prominent stops in the database and the only ones without a citation, which
-- is the wrong way round.
--
-- Centralia is the exception and stays unverified: the borough was almost
-- entirely bought out and demolished, so no official body maintains a page
-- about visiting it. Better to say so than to cite a blog.

update public.stops set
  description = 'Point Pleasant spent thirteen months in 1966 and 1967 reporting a winged figure with red eyes, and it has never really stopped. The museum keeps the newspaper clippings, the witness statements and props from the film adaptation in one small storefront on Main Street, a short walk from the statue.',
  source = 'https://www.mothmanmuseum.com/', verified_at = now()
where slug = 'mothman-museum';

update public.stops set
  description = 'In September 1952 a group of Braxton County children went up a hill after a light in the sky and came back down describing something ten feet tall in a pleated metal skirt. The museum grew out of a single display case in the county visitor centre and now holds the clippings, the witness accounts and a wall of Flatwoods Monster memorabilia. Admission is free, and it doubles as the Braxton County Visitors Center.',
  source = 'https://braxtonwv.org/the-flatwoods-monster/visit-the-museum/', verified_at = now()
where slug = 'flatwoods-monster-museum';

update public.stops set
  description = 'Something came down in the woods here on the evening of 9 December 1965, seen across several states. Astronomers called it a meteor; witnesses described an acorn-shaped object and a military convoy. The village settled the matter its own way: the large acorn outside the volunteer fire department is a prop built for an Unsolved Mysteries episode in 1990, and it has stood there ever since.',
  source = 'https://en.wikipedia.org/wiki/Kecksburg_UFO_incident', verified_at = now()
where slug = 'kecksburg-ufo-monument';

update public.stops set
  description = 'Guided tours through a tilted building where a ball rolls uphill and standing straight feels wrong, run since 1973 beside Route 60 with a Volkswagen Beetle embedded in the wall. Fifteen or twenty minutes, seasonal hours, no cameras inside, and entirely committed to the bit.',
  source = 'http://www.mysteryhole.com/', verified_at = now()
where slug = 'the-mystery-hole';

update public.stops set
  description = 'Put the car in neutral at the marked spot on Gravity Hill Road and it rolls, slowly, in the wrong direction. The surrounding hills hide the true horizon well enough that your eyes lose the argument with the road. Bring a bottle of water to pour out and watch. There are two such stretches in the area.',
  source = 'https://en.wikipedia.org/wiki/List_of_gravity_hills', verified_at = now()
where slug = 'gravity-hill-new-paris';

update public.stops set
  description = 'A quarter-mile of hand-cut sandstone, built for 250 patients and holding well over two thousand by the 1950s. Daytime tours cover the architecture and the medical history; the overnight ones cover the reason most people have heard of it.',
  source = 'https://trans-alleghenylunaticasylum.com/', verified_at = now()
where slug = 'trans-allegheny-lunatic-asylum';
