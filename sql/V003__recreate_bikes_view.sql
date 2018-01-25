drop view bikes;
create view bikes as
with ranked_bike_locations as (
	select *, rank() over (partition by bike_id order by created desc)
	from bike_locations
)
select location_id, location, provider, bike_id, created, raw from ranked_bike_locations
where rank=1;
