import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

const fetchMetaData = (ipfsHash) => {
  const metaDataJson = localStorage.getItem(`metadata_${ipfsHash}`);

  if(!metaDataJson){
    console.log(`no metadata found for NFT ${ipfsHash}`);
    return null;
  }
  try{
    const metaData = JSON.parse(metaDataJson);
    console.log(`metadata for nft ${ipfsHash} fetched successfully`);
    return metaData;
  }catch(err){
    console.error('error parsing metadata from localstorage: ', err);
    return null;
  }
};


export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState([])
  const loadPurchasedItems = async () => {
    // Fetch purchased items from marketplace by quering Offered events with the buyer set as the user
    const filter =  marketplace.filters.Bought(null,null,null,null,null,account)
    const results = await marketplace.queryFilter(filter)
    //Fetch metadata of each nft and add that to listedItem object.
    const purchases = await Promise.all(results.map(async i => {
      // fetch arguments from each result
      i = i.args
      // get uri url from nft contract
      const uri = await nft.tokenURI(i.tokenId)
        console.log("purchase ki uri: ", uri);
        const parts = uri.split("/");
        const ipfsHash = parts[parts.length - 1];
        const metaData = fetchMetaData(ipfsHash);
        console.log("metadata: ",metaData);
        // define listed item object
        let name = "name";
        let desc = "desc";
        let image = "https://violet-key-lamprey-665.mypinata.cloud/ipfs/QmZ7T82k9pDCDMMXpaxk5JnaBZMRdRmhsGDqjrAuKXS9st";
        if(metaData!=null){
          name = metaData.name;
          desc = metaData.description;
          image = metaData.image;
        }
      // use uri to fetch the nft metadata stored on ipfs 
      // const response = await fetch(uri)
      // const metadata = await response.json()
      // get total price of item (item price + fee)
      const totalPrice = await marketplace.getTotalPrice(i.itemId)
      // define listed item object
      let purchasedItem = {
        totalPrice,
        price: i.price,
        itemId: i.itemId,
        name: name,
        description: desc,
        image: image
      }
      return purchasedItem
    }))
    setLoading(false)
    setPurchases(purchases)
  }
  useEffect(() => {
    loadPurchasedItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {purchases.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No purchases</h2>
          </main>
        )}
    </div>
  );
}