# Config

You can configure persephone by editing various files in config/

## persephone_config.json

Databases for each package can be configured manually, if for whatever reason you have a shared userbase but have different stickers, or shared media archive with different comments etc.

Currently working and tested database types are sqlite and mysql. For sqlite put the path to the db file in the host field, for mysql the host should be in the format "host/database?charset=utf8", and user and pass go in their respective fields

You can also configure some or all of the packages to use a common db by specifying the type as "common" and defining the common connection in persephone_config["db"]["common"]

| Field | Description |
| --- | --- |
| static_persephone_uri | If you're using a separate domain for serving static content you can point to the uri that serves persephone static files here. Leave blank to serve them with persephone |
| static_custom_uri | If you're using a separate domain for serving static content you can point to the uri that serves custom static files here. Leave blank to serve them with persephone |
| signed_in_only | When set to true will redirect any page not related to sign in or registration to the sign in list. By default this also includes serving any actual media files (you can circumvent this by serving media files from a static domain and not passing them through persephone) |
| default_theme | The default theme of the site automatically applied for anyone who hasn't chosen a preferred theme |
| initial_theme_color | The theme color is changed automatically by javascript to match the background color of the current css theme, but the initial value is used in some social media cards (such as discord's stripe color) so you can set that here |
| site_image_uri | The image used for generic site pages in opengraph and twitter cards, leave blank to use persephone logo |
| site_favicon_ico_uri | You can override the ico favicon with any uri that points to an ico file with this. Leave blank to use the ico favicon at static/favicon.ico (you probably won't need this unless you're sharing an underlying instance and static file server and need each front instance to have different favicons) |
| site_favicon_png_uri | You can override the png favicon with any uri that points to a png file with this, leave blank to use the png favicon at static/favicon.png (you probably won't need this unless you're sharing an underlying instance and static file server and need each front instance to have different favicons) |
| site_name | The site name used in opengraph and twitter cards |
| site_title | The actual title appended to site pages and also used in some opengraph and twitter cards |
| custom_groups | Group names that can be assigned to users and which can be set for media to restrict access and searchability to them and for stickers to restrict who can receive them from the gachapon |
| optional_packages | You can toggle some of persephone's packages off sitewide, including: stickers, comments, patreon, and tegaki. If you don't plan on using a particular package it's probably worth it to disable it for a small performance gain |
| public_contributors | Add user id strings to this array to restrict which users will be displayed in the public search and on user media pages. If this is an empty array then no restrictions are added and the searches behave normally. This is mainly for if you have a single large instance with multiple contributors but different instances that only show particular users on each |
| google_verification | If you have a google verification code you can put it here to verify your ownership of the site to google |
| google_analytics | If you use google analytics you can put your site id code here to enable it |

## access_log_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created access log tables |

## bans_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created bans tables |
| expired_ban_review_lifetime | Number of seconds to retain expired ban records before they're pruned |
| maximum_reason_length | Maximum string length of reason comments, default is the same as the default column size. You can make it smaller than that but not bigger |
| maximum_note_length | Maximum string length of internal note comments, default is the same as the default column size. You can make it smaller than that but not bigger |

## comments_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created comments tables |
| allow_guest_comments | Whether to allow non-signed-in users to create comments |
| anoymous_comments | Whether to hide avatar and profile links on displayed comments from non managers |
| create_guest_comment_cooldown_amount | The number of comments a non-signed-in-user can make within the create_guest_comment_cooldown_period before being throttled |
| create_guest_comment_cooldown_period | The number of seconds back to check if a non-signed-in-user has reached the create_guest_comment_cooldown_amount limit |
| create_user_comment_cooldown_amount | The number of comments a signed-in-user can make within the create_user_comment_cooldown_period before being throttled |
| create_user_comment_cooldown_period | The number of seconds back to check if a signed-in-user has reached the create_user_comment_cooldown_amount limit |
| [forbidden][strings] | An array of exact strings that will prevent a comment from being created |
| [forbidden][res] | An array of regular expression patterns that will prevent a comment from being created |
| maximum_body_length | Maximum string length of comment body, default is the same as the default column size, can make it smaller than that but not bigger |

## credentials.json

Your oauth sign-in credentials to allow one-click sign-ins to work, they're all pretty standard, twitter client_id is the Consumer API key and client_secret is the Consumer API secret key
all the other services should call the client_id and client_secret Client ID and Client Secret

## legal_config.json

| Field | Description |
| --- | --- |
| takedown_contact_mail | The email displayed on /legal/takedown for people to contact about dmca claims and counterclaims |
| terms_agree | The cookie information for the terms agreement cookie |

## media_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created media tables
| ffprobe_path | The absolute path to the ffprobe binary on your system, leave blank for none |
| ffmpeg_path | The absolute path to the ffmpeg binary on your system, leave blank for none |
| ffmpeg_thread_limit | The number of threads to limit ffmpeg calls to |
| temp_path | The absolute path to store temporary files created by the media package |
| media_path | The absolute path to store original media files |
| summaries_path | The absolute path to store generated media summary files |
| tags_path | The absolute path to store generated tag suggestion files |
| medium_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves original media files here. Leave blank to serve them with persephone |
| summary_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves media summary files here. Leave blank to serve them with persephone |
| tags_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves tag suggestion files here. Leave blank to serve them with persephone |
| upload_cooldown_amount | The number of uploads a non-manager-user can make within the upload_cooldown_period before being throttled |
| upload_cooldown_period | The number of seconds back to check if a non-manager-user has reached the upload_cooldown_amount limit |
| per_medium_like_cooldown_amount | The number of likes a user can add to a particular medium within the per_medium_like_cooldown_period before being throttled |
| per_medium_like_cooldown_period | The number of seconds back to check if a user has reached the per_medium_like_cooldown_amount limit |
| maximum_tag_length | Maximum string length of tags, default is the same as the default column size, can make it smaller than that but not bigger |
| requirable_groups | Add group names to this array to have them appear in the edit medium groups list, and mass management groups list |
| premium_groups | Add group names to this array to have media protected with them marked as premium and show the premium template instead of the protected template when a user doesn't have permission to view them |
| upload_defaults | The default state of the advanced upload options form |
| disallowed_mimetypes | Add mimetypes to this array to prevent them from being uploaded |
| maximum_upload_filesize | Max filesize in bytes that is allowed |
| maximum_search_tags | The maximum number of tags allowed in a single search |
| maximum_search_perpage | The maximum number of results per search page |
| hide_total_like_counts | Whether like count bubbles on the search thumbnails and the like count next to the like button on the view medium page are hidden |
| summary_edges | The edge sizes of summaries to generate for images |
| summary_values | Which summary edge sizes to use for "view" and "thumbnail" |
| video_snapshots | (Not currently used, but would be the number of snapshots in a video summary slideshow preview) |
| video_slideshow_edge | (Not currently used, but would be the summary edge size to use for video slideshows) |
| video_reencode_edge | The edge size to use to re-encode non-websafe video files (basically anything that isn't already mp4 or webm) |
| video_clip_edge | The edge size to use to create summary clips from videos |
| video_clip_duration_ms | The duration of the video clip summary cut from the middle of videos to use for thumbnail hover previews |
| default_thumbnail_edge | Deprecated? Should be the same as [summary_values][thumbnail] regardless) |
| default_view_edge | (Deprecated? Should be the same as [summary_values][view] regardless) |
| canonical_search_tags | Add entries to this dictionary in the form of "tag to alias from": "tag to alias to" to allow searches for the key to return media tagged with the value (the tags to alias from won't show up anywhere in the media archive unless they're actually used on media, and won't autosuggest in search or tag edit fields) |
| clutter_tag_prefixes | Any tags starting with these values won't be included in search suggestions or show up in the tags this page block |

## patreon_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created patreon tables |
| default_permission_length | The default number of seconds to use for creating permissions for patreon tiers and benefits |

## shortener_config.json

add entries to this dictionary in the form of "name": "url/to/redirect/to" to have /to/name on your instance redirect to url/to/redirect/to

## stickers_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created stickers tables |
| temp_path | The absolute path to store temporary files created by the stickers package |
| sticker_images_path | The absolute path to store generated sticker image files |
| sticker_placements_path | The absolute path to store generated sticker placements files |
| sticker_image_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves sticker image files here. Leave blank to serve them with persephone |
| sticker_placements_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves sticker placements files here. Leave blank to serve them with persephone |
| sticker_edge | The image edge to size down uploaded sticker images to, and the default display edge dimensions |
| place_sticker_cooldown_amount | The number of sticker placements a user can make within the place_sticker_cooldown_period before being throttled |
| place_sticker_cooldown_period | The number of seconds back to check if a user has reached the place_sticker_cooldown_amount limit |
| receive_sticker_cooldown_amount | The number of stickers a user can receive from the gachapon within the receive_sticker_cooldown_period before being throttled |
| receive_sticker_cooldown_period | The number of seconds back to check if a user has reached the receive_sticker_cooldown_amount limit |
| maximum_name_length | Maximum string length of sticker names, default is the same as the default column size. You can make it smaller than that but not bigger |
| maximum_display_length | Maximum string length of sticker displays, default is the same as the default column size. You can make it smaller than that but not bigger |
| categories | The categories available to assign stickers to, in the order they are categorized in the stickerbook and sticker drawer |
| maximum_stickers_per_target | The total number of stickers a normal user may place on any particular target |
| maximum_stickers_per_target_custom | Add entries to this dictionary in the format "group name": {number of stickers} to allow users with group permission group name to place the defined number of stickers on any particular target. if a user has multiple group permissions that apply they'll always get the highest amount. there are two special amounts you can assign: -1 for no limit, and 0 for unable to place any stickers, both of which will always take precedence over the default and any other permissions they have |

## users_config.json

| Field | Description |
| --- | --- |
| db_prefix | The prefix to add to created users tables |
| temp_path | The absolute path to store temporary files created by the users package |
| avatars_path | The absolute path to store generated avatar image files |
| avatar_file_uri | If you're using a separate domain for serving static content you can point to the uri that serves avatar files here, leave blank to serve them with persephone |
| avatar_edge | The image edge to size down uploaded avatar images to, and the default display edge dimensions |
| session | The cookie information for the session cookie |
| ignore_session_useragent_mismatch | Whether not to autoclose a user's session if the useragent they're using doesn't match the useragent they created the session with (enabled by default so that users aren't signed out for browser updates that cause useragent changes) |
| ignore_session_remote_origin_mismatch | Whether not to autoclose a user's session if the ip address they're using doesn't match the ip address they created the session with (disabled by default) |
| invite_lifetime | How long an invite is valid for after creation (in seconds) |
| registration_closed | Prevent creating new accounts without an invite |
| registration_cooldown_amount | The number of accounts that can be created by a particular ip within the registration_cooldown_period before being throttled |
| registration_cooldown_period | The number of seconds back to check if a particular ip has reached the registration_cooldown_amount limit |
| automatic_activation | Whether to activate newly registered users immediately (if disabled then managers must activate users manually) |
| authentication_collision_cooldown_amount | The number of registration or connect authentication attempts by a particular ip or user id that collide with existing authentications that can be made within the authentication_collision_cooldown_period before being throttled |
| authentication_collision_cooldown_period | The number of seconds back to check if a particular ip or user id has reached the authentication_collision_cooldown_amount limit |
| sign_in_attempt_cooldown_amount | The number of failed sign in attempts by a particular ip that can be made within the sign_in_attempt_cooldown_period before being throttled |
| sign_in_attempt_cooldown_period | The number of seconds back to check if a particular ip has reached the sign_in_attempt_cooldown_amount limit |
| invite_creation_cooldown_amount | The number of invites that a user can create within the invite_creation_cooldown_period before being throttled |
| invite_creation_cooldown_period | The number of seconds back to check if a user has reached the invite_creation_cooldown_amount limit |
| authentication_services | A list of authentication services supported, set a service to true to allow sign-in with it and set to false to disable (you must configure credentials above for many of these to work) |
| maximum_name_length | Maximum string length of user names, default is the same as the default column size, can make it smaller than that but not bigger |
| maximum_display_length | Maximum string length of user displays, default is the same as the default column size, can make it smaller than that but not bigger |
| minimum_pass_length | Minimum passphrase length for local account registration |
| default_auto_permission_duration | The default value of auto permission durations during creation (in seconds) |
| home_endpoint | This should be left as "persephone.home" unless you've modified persephone with another endpoint you'd prefer |
| reserved_names | Add strings to this array to prevent them from being used as account names |
| always_visible_profile_groups | Add group names to this array to force their group tiles to appear on profiles dimmed out if the user doesn't have them |
