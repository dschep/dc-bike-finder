create extension postgis;
create extension postgis_topology;

create table bike_locations (
  location_id bigserial primary key,
  location geometry,
  provider text,
  bike_id text,
  created timestamp default now()
);

create view bikes as (
  select *
  from bike_locations p1
  where created=(select max(created) from bike_locations p2 where p1.bike_id=p2.bike_id)
    and created > now() - '2min'::interval)
