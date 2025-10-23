inputs_plugin_file="./kestra/.plugins"
PLUGINS=$([ -f $inputs_plugin_file ] && cat $inputs_plugin_file | grep "io\\.kestra\\." | sed -e '/#/s/^.//' | sed -e "s/LATEST/0.22222.1/g" | cut -d':' -f2- | xargs || echo '');
REPOSITORIES=$([ -f $inputs_plugin_file ] && cat $inputs_plugin_file | grep "io\\.kestra\\." | sed -e '/#/s/^.//' | cut -d':' -f1 | uniq | sort | xargs || echo '')
#echo "plugins=$PLUGINS"
echo $PLUGINS
#echo "repositories=$REPOSITORIES"
