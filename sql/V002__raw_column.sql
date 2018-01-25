alter table bike_locations add column raw jsonb;

create or replace view bikes as (
  select *
  from bike_locations p1
  where created=(select max(created) from bike_locations p2 where p1.bike_id=p2.bike_id)
    and created > now() - '70s'::interval)
