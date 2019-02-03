# persephone

A media archive (with other cool stuff).

---

I'm still testing this so wait a bit unless you want to play around with it right away.

---

## Things persephone is good for

### A public-facing archive of personal work.

This is primarily why I wrote it. It also works well for a handful of like-minded or collaborative people to use together.

### A private media organization archive

Having a personal media server at home where everything is taggable and viewable directly is convenient. I use a private instance as a kind of personal inspiration dump where I put things I like to look at to get inspired to draw or write.

---

## Things persephone is probably not great for

### Simple galleries

If you don't need granular access permission, or an accounts system for non-contributors, or stickers/comments/etc, you will probably be better off with just hosting and ftp access. Maybe some lightweight script that just reads a directory and spits out a page of media previews.

There are already a lot of decent and tiny simple gallery programs out there, and persephone is probably overbuilt for most people who don't need much of its functionality.

### Many contributors

An instance of persephone is not meant to be home for a large number of users with upload permission. While the core functionality will work, the extended functionality such as Patreon integration could become unmanageable quickly, and management features such as the mass tag editor aren't yet sufficiently compartmentalized for each creator to use without affecting everyone else.

There are already a lot of decent and ambitious gallery platforms out there, and I don't have any intention to really push this project in that direction.

### Social interaction

There's RSS now, consumers of content can watch for updates from afar.

I added comments a while ago, and before that stickers were the only way to interact with the content uploaded by contributors.

I recently added actual likes instead of just seeing media you've put particular stickers on, so that non-contributing users can look through things they've marked as liked, similar to traditionally larger gallery sites, but these are just for the convenience of users, they're not publicly displayed anywhere.

There are now somewhat robust opengraph and twitter card meta tags, so just sharing links should create relatively nice-looking embeded media.

There are already a lot of decent and ambitious blogging, micro-blogging, and socially-connected gallery platforms out there, and I don't have any intention to really push this project in that direction.

### Very large instances in general

I'm not a professional programmer and I don't really have any idea how well this will scale with extremely heavy traffic. The number of active users on instances belonging to me and my friends has been between 5,000 to 10,000. If you're very popular and you're using this let me know how it holds up.

### Heavy moderation

There is a basic ban system, and finding and deactivating users is easy, but I don't know how much trouble a large unruly userbase would be with just the tools that I've written into it so far.

It's a personal site with fun extras for users with accounts, and it's fun if anyone can participate, but I would rather close registration than deal with moderating people all day. So I will probably not devote too much time to improving or writing new moderation tools.

---

## Install

- Make sure you have Git installed.
- Make sure you have Python 3.5+ installed.
- Download the install script for [Linux/Mac](persephone_install.sh) or [Windows](persephone_install.cmd) and run it.
- Follow the installation prompts.

---

## Dependencies

Here's some good stuff I didn't write that went into making this.

- [Flask](https://github.com/pallets/flask)
- [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy)
- [Werkzeug](https://github.com/pallets/werkzeug)
- [dateutil](https://github.com/dateutil/dateutil)
- [Pillow](https://github.com/python-pillow/Pillow)
- [python3-openid](https://github.com/necaris/python3-openid)
- [passlib](https://bitbucket.org/ecollins/passlib/wiki/Home)
- [python-magic](https://github.com/ahupp/python-magic)
- [python-libmagic](https://github.com/dveselov/python-libmagic)
- [python-magic-bin](https://github.com/julian-r/python-magic)

---

## Component projects

Here's some good stuff I wrote that went into making this.

- [Accounts](https://github.com/secretisdead/accounts)
- [Bans](https://github.com/secretisdead/bansfrontend)
- [Media](https://github.com/secretisdead/mediafrontend)
- [Stickers](https://github.com/secretisdead/stickersfrontend)
- [Comments](https://github.com/secretisdead/commentsfrontend)
- [Patreon](https://github.com/secretisdead/patreonfrontend)
