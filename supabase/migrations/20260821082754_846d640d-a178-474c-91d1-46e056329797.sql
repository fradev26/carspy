DO $$
DECLARE
  v_dealer uuid := 'cc9edc30-086c-4606-9c27-6a443d0f90ea';
  v_company uuid := 'ab76d5ff-2dd9-4d76-abad-75341573da39';
  v_buyer1 uuid := '1d682d72-4ed5-460b-aa58-5a69996a20d2';
  v_buyer2 uuid := '40ff791c-9dc7-44c1-bd31-3bd02ebeb456';
  v_buyer3 uuid := 'cf853327-579a-4634-8988-94f304787877';
  img text[][] := ARRAY[
    ARRAY['01_vw_golf_1_exterieur_voor','01_vw_golf_2_exterieur_zij','01_vw_golf_3_interieur'],
    ARRAY['02_peugeot_2008_1_exterieur_voor','02_peugeot_2008_2_exterieur_zij','02_peugeot_2008_3_interieur'],
    ARRAY['03_tesla_model3_1_exterieur_voor','03_tesla_model3_2_exterieur_zij','03_tesla_model3_3_interieur'],
    ARRAY['04_bmw_3reeks_1_exterieur_voor','04_bmw_3reeks_2_exterieur_zij','04_bmw_3reeks_3_interieur'],
    ARRAY['05_renault_kangoo_1_exterieur_voor','05_renault_kangoo_2_exterieur_zij','05_renault_kangoo_3_interieur']
  ];
  base text := 'https://jgrxbjkeordnqgqaocbi.supabase.co/storage/v1/object/public/listing-images/testdata/';
  r record;
  new_id uuid;
  d int;
  ids uuid[] := '{}';
BEGIN
  -- opruimen van eerdere mockdata voor dit account
  DELETE FROM public.listings WHERE user_id = v_dealer AND external_source = 'mock-seed';

  FOR r IN
    SELECT * FROM (VALUES
      ('Volkswagen Golf 1.5 TSI Life','Volkswagen','Golf',2021,24950,58000,'benzine','automaat','hatchback','Grijs',110,5,5,'Gent','Oost-Vlaanderen','active',1,241,3,true,null::int,null::timestamptz,20100),
      ('Peugeot 2008 GT Line','Peugeot','2008',2022,22900,31000,'benzine','handgeschakeld','suv','Blauw',96,5,5,'Gent','Oost-Vlaanderen','active',2,187,12,false,null,null,18700),
      ('Tesla Model 3 Long Range','Tesla','Model 3',2023,36900,24000,'elektrisch','automaat','sedan','Wit',258,4,5,'Antwerpen','Antwerpen','active',3,412,6,true,null,null,31200),
      ('BMW 320d Touring Advantage','BMW','3-serie',2019,19750,142000,'diesel','automaat','stationwagon','Zwart',140,5,5,'Gent','Oost-Vlaanderen','active',4,96,26,false,null,null,16300),
      ('Renault Kangoo Express Comfort','Renault','Kangoo',2020,12900,98000,'diesel','handgeschakeld','bestelwagen','Wit',70,4,2,'Gent','Oost-Vlaanderen','active',5,54,41,false,null,null,10400),
      ('Volkswagen Polo 1.0 TSI Style','Volkswagen','Polo',2022,18450,29000,'benzine','handgeschakeld','hatchback','Rood',70,5,5,'Gent','Oost-Vlaanderen','active',1,132,18,false,null,null,15100),
      ('BMW X1 sDrive18i','BMW','X1',2021,29900,47000,'benzine','automaat','suv','Grijs',100,5,5,'Gent','Oost-Vlaanderen','active',4,88,9,false,null,null,25400),
      ('Peugeot 308 SW Allure','Peugeot','308',2020,16900,116000,'diesel','handgeschakeld','stationwagon','Grijs',96,5,5,'Gent','Oost-Vlaanderen','active',2,61,63,false,null,null,13900),
      ('Tesla Model 3 Standard Range','Tesla','Model 3',2021,28900,71000,'elektrisch','automaat','sedan','Zwart',208,4,5,'Gent','Oost-Vlaanderen','reserved',3,203,21,false,null,null,24800),
      ('Renault Clio TCe Intens','Renault','Clio',2021,14750,63000,'benzine','handgeschakeld','hatchback','Blauw',67,5,5,'Gent','Oost-Vlaanderen','draft',5,3,2,false,null,null,12200),
      ('Volkswagen Passat Variant Elegance','Volkswagen','Passat',2019,17900,168000,'diesel','automaat','stationwagon','Blauw',110,5,5,'Gent','Oost-Vlaanderen','draft',1,0,1,false,null,null,14500),
      ('BMW 118i Model Sport','BMW','1-serie',2020,21500,72000,'benzine','automaat','hatchback','Wit',103,5,5,'Gent','Oost-Vlaanderen','sold',4,318,74,false,22400,null,18200),
      ('Peugeot 3008 Allure Pack','Peugeot','3008',2021,26400,54000,'diesel','automaat','suv','Grijs',96,5,5,'Gent','Oost-Vlaanderen','sold',2,276,88,false,26900,null,22800),
      ('Renault Captur E-Tech Hybrid','Renault','Captur',2022,21900,38000,'hybride','automaat','suv','Oranje',105,5,5,'Gent','Oost-Vlaanderen','sold',5,190,52,false,21400,null,18600)
    ) AS t(title,brand,model,year,price,mileage,fuel,trans,body,color,power,doors,seats,city,province,status,imgset,views,age_days,premium,sold_price,dummy,cost_price)
  LOOP
    new_id := gen_random_uuid();
    ids := ids || new_id;
    INSERT INTO public.listings (
      id,user_id,company_id,title,brand,model,year,price,mileage,fuel_type,transmission,body_type,color,power,doors,seats,
      description,features,images,city,province,status,views,created_at,updated_at,is_premium,boost_until,
      cost_price,sold_price,sold_at,vat_deductible,price_negotiable,warranty_months,external_source,source
    ) VALUES (
      new_id,v_dealer,v_company,r.title,r.brand,r.model,r.year,r.price,r.mileage,r.fuel,r.trans,r.body,r.color,r.power,r.doors,r.seats,
      'Netjes onderhouden ' || r.brand || ' ' || r.model || ' uit ' || r.year || ', volledig onderhoudsboekje, gekeurd voor verkoop en beschikbaar met garantie bij Snabba Cars.',
      ARRAY['Airconditioning','Navigatie','Parkeersensoren','Cruise control','Bluetooth'],
      ARRAY[base || img[r.imgset][1] || '.jpg', base || img[r.imgset][2] || '.jpg', base || img[r.imgset][3] || '.jpg'],
      r.city,r.province,r.status,r.views,
      now() - (r.age_days || ' days')::interval, now() - (r.age_days || ' days')::interval,
      r.premium,
      CASE WHEN r.premium THEN now() + interval '9 days' ELSE NULL END,
      r.cost_price, r.sold_price,
      CASE WHEN r.status='sold' THEN now() - ((r.age_days/2) || ' days')::interval ELSE NULL END,
      true, true, 12, 'mock-seed', 'dealer'
    );

    -- weergaves per dag (laatste 90 dagen), meer voor recente/populaire advertenties
    IF r.status <> 'draft' THEN
      FOR d IN 0..LEAST(89, GREATEST(1, r.age_days)) LOOP
        INSERT INTO public.listing_view_events (listing_id, day, session_hash, source, created_at)
        SELECT new_id, (current_date - d), md5(new_id::text || d::text || g::text), (ARRAY['search','home','direct','dealer'])[1 + (g % 4)], now() - (d || ' days')::interval
        FROM generate_series(1, GREATEST(1, (r.views / GREATEST(1, LEAST(90, r.age_days)))::int + (CASE WHEN d < 7 THEN 2 ELSE 0 END))) g
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  -- leads voor de dealer
  DELETE FROM public.dealer_leads WHERE user_id = v_dealer AND source = 'mock-seed';
  INSERT INTO public.dealer_leads (name,email,phone,company,vat_number,message,source,status,user_id,created_at)
  VALUES
    ('Lieselot Vermeersch','lieselot.v@example.com','+32 478 12 34 56',NULL,NULL,'Is de BMW 320d Touring nog beschikbaar voor een proefrit dit weekend?','mock-seed','new',v_dealer, now() - interval '2 days'),
    ('Karel De Smet','karel.desmet@example.com','+32 496 77 21 09','De Smet Transport','BE0123456789','Interesse in de Renault Kangoo, graag prijs excl. btw.','mock-seed','contacted',v_dealer, now() - interval '6 days'),
    ('Nadia Bakker','nadia.bakker@example.com','+31 6 2211 8834',NULL,NULL,'Kan de Tesla Model 3 geleverd worden in Nederland?','mock-seed','new',v_dealer, now() - interval '1 day'),
    ('Tom Peeters','tom.peeters@example.com','+32 471 55 66 77',NULL,NULL,'Wat is de laagste prijs voor de Peugeot 2008?','mock-seed','won',v_dealer, now() - interval '19 days'),
    ('Sofie Claes','sofie.claes@example.com','+32 488 90 11 22',NULL,NULL,'Graag meer fotos van het interieur van de Golf.','mock-seed','lost',v_dealer, now() - interval '31 days');

  -- reviews
  DELETE FROM public.dealer_reviews WHERE dealer_user_id = v_dealer;
  INSERT INTO public.dealer_reviews (dealer_user_id,author_id,rating,title,body,status,created_at) VALUES
    (v_dealer,v_buyer1,5,'Vlotte en eerlijke verkoop','Alles duidelijk uitgelegd, wagen was exact zoals beschreven. Aanrader.','published', now() - interval '12 days'),
    (v_dealer,v_buyer2,4,'Correcte service','Goede opvolging, levering duurde iets langer dan afgesproken.','published', now() - interval '34 days'),
    (v_dealer,v_buyer3,5,'Top begeleiding','Kregen goed advies over financiering en garantie.','published', now() - interval '60 days');

  -- openingsuren
  DELETE FROM public.dealer_opening_hours WHERE user_id = v_dealer;
  INSERT INTO public.dealer_opening_hours (user_id,weekday,closed,opens,closes,break_start,break_end) VALUES
    (v_dealer,1,false,'09:00','18:00','12:00','13:00'),
    (v_dealer,2,false,'09:00','18:00','12:00','13:00'),
    (v_dealer,3,false,'09:00','18:00','12:00','13:00'),
    (v_dealer,4,false,'09:00','18:00','12:00','13:00'),
    (v_dealer,5,false,'09:00','19:00',NULL,NULL),
    (v_dealer,6,false,'10:00','16:00',NULL,NULL),
    (v_dealer,0,true,NULL,NULL,NULL,NULL);

  -- gesprekken met kopers
  INSERT INTO public.conversations (id,listing_id,buyer_id,seller_id,created_at,updated_at)
  SELECT gen_random_uuid(), ids[1], v_buyer1, v_dealer, now() - interval '3 days', now() - interval '3 hours'
  WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE listing_id = ids[1] AND buyer_id = v_buyer1);
  INSERT INTO public.conversations (id,listing_id,buyer_id,seller_id,created_at,updated_at)
  SELECT gen_random_uuid(), ids[3], v_buyer2, v_dealer, now() - interval '8 days', now() - interval '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE listing_id = ids[3] AND buyer_id = v_buyer2);

  INSERT INTO public.messages (conversation_id,sender_id,content,created_at,read_at)
  SELECT c.id, v_buyer1, 'Dag, is deze Golf nog beschikbaar?', now() - interval '3 days', now() - interval '3 days'
  FROM public.conversations c WHERE c.listing_id = ids[1] AND c.buyer_id = v_buyer1
  AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id);
  INSERT INTO public.messages (conversation_id,sender_id,content,created_at)
  SELECT c.id, v_dealer, 'Goeiedag, zeker! U kan langskomen voor een proefrit deze week.', now() - interval '3 days' + interval '2 hours'
  FROM public.conversations c WHERE c.listing_id = ids[1] AND c.buyer_id = v_buyer1
  AND (SELECT count(*) FROM public.messages m WHERE m.conversation_id = c.id) = 1;
  INSERT INTO public.messages (conversation_id,sender_id,content,created_at)
  SELECT c.id, v_buyer2, 'Kan de Tesla ook met trekhaak geleverd worden?', now() - interval '1 day'
  FROM public.conversations c WHERE c.listing_id = ids[3] AND c.buyer_id = v_buyer2
  AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id);
END $$;