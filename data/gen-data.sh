for x in {1..100}
do 
  touch data-$x.txt 
  echo 'hello' > data-$x.txt
done 