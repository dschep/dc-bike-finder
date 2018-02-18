create index bike_locations_id_index on bike_locations (location_id);

create index bike_locations_created_index on bike_locations (created);

---- Get latest position of every bike. no ofo, bc they don'thave bike IDs :(
create or replace view bikes as (select p1.* from bike_locations p1
where provider<>'ofo'
  and location_id=(select location_id from bike_locations p2
                   where p1.bike_id=p2.bike_id
                   order by created limit 1)
                   )
union
---- Get positions of latest batch of ofo bikes loaded
(
with latest_batch as (
  select bike_id
  from bike_locations
  where provider='ofo'
  group by bike_id
  order by max(created) desc
  limit 1)
select bike_locations.* from bike_locations
join latest_batch using (bike_id)
);