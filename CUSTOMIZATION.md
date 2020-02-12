# Customization

You can override any template by copying it from its source module to templates/ and editing it there

Some common ones are

- /repos/persephone/persephone/views/templates/about.html to edit the about text to be about you
- /repos/legal/legal/templates/legal_terms.html if you want different terms of use than persephone default
- /repos/legal/legal/templates/legal_rules.html if you want different site rules than persephone default
- /repos/persephone/persephone/views/templates/premium_info-example.html (to /templates/premium_info.html) if you plan on using premium groups and want to have information available about how to get them

*You'll likely have to restart the webserver to pick up new templates after changing them.*

This will be different depending on what your server software is.

For example restarting an Apache2 server which is using mod_wsgi on Debian 10 can be done with systemctl

```console
$ sudo systemctl restart apache2
```
Some hosting providers will be using Phusion Passenger, which can be informed that a server restart is needed by touching a particular file.

```console
$ cd /your/persephone/install/dir
$ sudo touch ./tmp/restart.txt
```

Consult the documentation for your server software if you're unsure of the recommended way to restart it.

Remember that overriding templates will prevent updates from affecting those pages, so check for changes to any templates you override when you update so that you can make those changes to your overriden templates if necessary

You can replace the default favicon.ico and favicon.png in static/

You can edit static/links/custom.css to add any custom style rules, including things like custom group tiles if you've made custom groups with

```css
[data-group-{your group name}] .summary.protected::before,
.group_tile[data-group="YOUR_GROUP_NAME"] {
    background-image: url(group_YOUR_GROUP_NAME.svg);
}
```

replacing YOUR_GROUP_NAME with the actual group name and making sure you upload a corresponding image to static/custom/links/ to use

or a custom gachapon insert image with

```css
#use_gachapon::after {
    background-image: url(gachapon_insert.png);
}
```

and making sure you upload your custom gachapon insert image to static/custom/links/ to use

If you make a full color theme for the secretgraphics skin most of the time I'll  be glad to include it in the selectable themes in the main distro, submit a pull request or dm me

If you create custom groups and would like them to have descriptive names instead of their plain group names you can delete the symlinked templates/groups.jinja and replace it with a copy of repos/persephone/templates/groups.jinja and edit it with entries in the form of "groupname": "Group Display Name",

The default width for rendered plaintext and html fragment media is 512px. If you want it to be different or to take up the full viewport you can add rules affecting .medium_contents in your custom.css something like

```css
.medium .medium_contents {
    width: auto;
}
```
